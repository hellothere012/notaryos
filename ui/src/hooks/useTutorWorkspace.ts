'use client';

// ═══════════════════════════════════════════════════════════
// useTutorWorkspace — CRUD hook for AI Tutor workspace
// Authenticated users: API calls via authClient
// Anonymous users: localStorage persistence
// ═══════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { authClient, API_ENDPOINTS } from '@/lib/api-client';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface Semester {
  id: number;
  name: string;
  is_active: boolean;
  course_count: number;
  created_at: string | null;
}

export interface Course {
  id: number;
  semester_id: number;
  name: string;
  subject: string;
  color: string;
  description: string | null;
  is_active: boolean;
  material_count: number;
  created_at: string | null;
}

export interface Material {
  id: number;
  course_id: number;
  title: string;
  material_type: string;
  content: string;
  summary: string | null;
  created_at: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const LS_KEY = 'notaryos_tutor_workspace';

const SUBJECT_COLORS: Record<string, string> = {
  math: '#e8a838',
  science: '#5ab89a',
  humanities: '#d47c8a',
  law: '#9a8ac8',
};

/* -------------------------------------------------------------------------- */
/*  localStorage helpers                                                       */
/* -------------------------------------------------------------------------- */

interface LocalWorkspace {
  semesters: Semester[];
  courses: Course[];
  materials: Material[];
  nextId: number;
}

function loadLocal(): LocalWorkspace {
  if (typeof window === 'undefined') {
    return { semesters: [], courses: [], materials: [], nextId: 1 };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted — reset
  }
  return { semesters: [], courses: [], materials: [], nextId: 1 };
}

function saveLocal(ws: LocalWorkspace): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ws));
  } catch {
    // storage full — fail silently
  }
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useTutorWorkspace(isAuthenticated: boolean) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courseContext, setCourseContext] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Fetch semesters (authenticated) ────────────────────
  const fetchSemesters = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const resp = await authClient.get(API_ENDPOINTS.tutorSemesters);
      const data: Semester[] = resp.data?.semesters ?? resp.data ?? [];
      setSemesters(data);
      // Auto-select first active semester if none selected
      if (data.length > 0 && !activeSemester) {
        const active = data.find((s) => s.is_active) ?? data[0];
        setActiveSemester(active);
      }
    } catch (err) {
      console.error('[useTutorWorkspace] fetchSemesters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch courses for active semester (authenticated) ──
  const fetchCourses = useCallback(async (semesterId: number) => {
    if (!isAuthenticated) return;
    try {
      const resp = await authClient.get(API_ENDPOINTS.tutorCourses(semesterId));
      const data: Course[] = resp.data?.courses ?? resp.data ?? [];
      setCourses(data);
    } catch (err) {
      console.error('[useTutorWorkspace] fetchCourses:', err);
    }
  }, [isAuthenticated]);

  // ── Fetch materials for active course (authenticated) ──
  const fetchMaterials = useCallback(async (courseId: number) => {
    if (!isAuthenticated) return;
    try {
      const resp = await authClient.get(API_ENDPOINTS.tutorMaterials(courseId));
      const data: Material[] = resp.data?.materials ?? resp.data ?? [];
      setMaterials(data);
    } catch (err) {
      console.error('[useTutorWorkspace] fetchMaterials:', err);
    }
  }, [isAuthenticated]);

  // ── Fetch course context (authenticated) ───────────────
  const fetchContext = useCallback(async (courseId: number) => {
    if (!isAuthenticated) return;
    try {
      const resp = await authClient.get(API_ENDPOINTS.tutorContext(courseId));
      setCourseContext(resp.data?.context ?? resp.data?.summary ?? '');
    } catch (err) {
      console.error('[useTutorWorkspace] fetchContext:', err);
      setCourseContext('');
    }
  }, [isAuthenticated]);

  // ── Load anonymous workspace from localStorage ─────────
  const loadAnonymous = useCallback(() => {
    const ws = loadLocal();
    setSemesters(ws.semesters);
    setCourses([]);
    setMaterials([]);
    setCourseContext('');
    if (ws.semesters.length > 0) {
      const active = ws.semesters.find((s) => s.is_active) ?? ws.semesters[0];
      setActiveSemester(active);
      const semCourses = ws.courses.filter((c) => c.semester_id === active.id);
      setCourses(semCourses);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchSemesters();
    } else {
      loadAnonymous();
    }
  }, [isAuthenticated, fetchSemesters, loadAnonymous]);

  // ── React to semester changes ──────────────────────────
  useEffect(() => {
    if (!activeSemester) {
      setCourses([]);
      setActiveCourse(null);
      setMaterials([]);
      setCourseContext('');
      return;
    }
    if (isAuthenticated) {
      fetchCourses(activeSemester.id);
    } else {
      const ws = loadLocal();
      setCourses(ws.courses.filter((c) => c.semester_id === activeSemester.id));
    }
    setActiveCourse(null);
    setMaterials([]);
    setCourseContext('');
  }, [activeSemester, isAuthenticated, fetchCourses]);

  // ── React to course changes ────────────────────────────
  useEffect(() => {
    if (!activeCourse) {
      setMaterials([]);
      setCourseContext('');
      return;
    }
    if (isAuthenticated) {
      fetchMaterials(activeCourse.id);
      fetchContext(activeCourse.id);
    } else {
      const ws = loadLocal();
      setMaterials(ws.materials.filter((m) => m.course_id === activeCourse.id));
      setCourseContext('');
    }
  }, [activeCourse, isAuthenticated, fetchMaterials, fetchContext]);

  // ── Mutations ──────────────────────────────────────────

  const createSemester = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isAuthenticated) {
      try {
        const resp = await authClient.post(API_ENDPOINTS.tutorSemesters, { name: trimmed });
        const created: Semester = resp.data;
        setSemesters((prev) => [...prev, created]);
        setActiveSemester(created);
      } catch (err) {
        console.error('[useTutorWorkspace] createSemester:', err);
      }
    } else {
      const ws = loadLocal();
      const newSem: Semester = {
        id: ws.nextId,
        name: trimmed,
        is_active: true,
        course_count: 0,
        created_at: new Date().toISOString(),
      };
      ws.semesters.push(newSem);
      ws.nextId += 1;
      saveLocal(ws);
      setSemesters([...ws.semesters]);
      setActiveSemester(newSem);
    }
  }, [isAuthenticated]);

  const createCourse = useCallback(async (name: string, subject: string, description?: string) => {
    if (!activeSemester) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const color = SUBJECT_COLORS[subject] ?? '#e8a838';

    if (isAuthenticated) {
      try {
        const resp = await authClient.post(API_ENDPOINTS.tutorCourses(activeSemester.id), {
          name: trimmed,
          subject,
          color,
          description: description?.trim() || null,
        });
        const created: Course = resp.data;
        setCourses((prev) => [...prev, created]);
        // Update semester course_count optimistically
        setSemesters((prev) =>
          prev.map((s) =>
            s.id === activeSemester.id ? { ...s, course_count: s.course_count + 1 } : s,
          ),
        );
      } catch (err) {
        console.error('[useTutorWorkspace] createCourse:', err);
      }
    } else {
      const ws = loadLocal();
      const newCourse: Course = {
        id: ws.nextId,
        semester_id: activeSemester.id,
        name: trimmed,
        subject,
        color,
        description: description?.trim() || null,
        is_active: true,
        material_count: 0,
        created_at: new Date().toISOString(),
      };
      ws.courses.push(newCourse);
      ws.nextId += 1;
      // Update course_count on the semester
      const semIdx = ws.semesters.findIndex((s) => s.id === activeSemester.id);
      if (semIdx >= 0) ws.semesters[semIdx].course_count += 1;
      saveLocal(ws);
      setCourses(ws.courses.filter((c) => c.semester_id === activeSemester.id));
      setSemesters([...ws.semesters]);
    }
  }, [isAuthenticated, activeSemester]);

  const addMaterial = useCallback(async (title: string, materialType: string, content: string) => {
    if (!activeCourse) return;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    if (isAuthenticated) {
      try {
        const resp = await authClient.post(API_ENDPOINTS.tutorMaterials(activeCourse.id), {
          title: trimmedTitle,
          material_type: materialType,
          content: trimmedContent,
        });
        const created: Material = resp.data;
        setMaterials((prev) => [...prev, created]);
        // Update material_count optimistically
        setCourses((prev) =>
          prev.map((c) =>
            c.id === activeCourse.id ? { ...c, material_count: c.material_count + 1 } : c,
          ),
        );
        // Refresh context since materials changed
        fetchContext(activeCourse.id);
      } catch (err) {
        console.error('[useTutorWorkspace] addMaterial:', err);
      }
    } else {
      const ws = loadLocal();
      const newMat: Material = {
        id: ws.nextId,
        course_id: activeCourse.id,
        title: trimmedTitle,
        material_type: materialType,
        content: trimmedContent,
        summary: null,
        created_at: new Date().toISOString(),
      };
      ws.materials.push(newMat);
      ws.nextId += 1;
      // Update material_count
      const courseIdx = ws.courses.findIndex((c) => c.id === activeCourse.id);
      if (courseIdx >= 0) ws.courses[courseIdx].material_count += 1;
      saveLocal(ws);
      setMaterials(ws.materials.filter((m) => m.course_id === activeCourse.id));
      setCourses((prev) =>
        prev.map((c) =>
          c.id === activeCourse.id ? { ...c, material_count: c.material_count + 1 } : c,
        ),
      );
    }
  }, [isAuthenticated, activeCourse, fetchContext]);

  const deleteMaterial = useCallback(async (id: number) => {
    if (isAuthenticated) {
      try {
        await authClient.delete(API_ENDPOINTS.tutorMaterial(id));
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        if (activeCourse) {
          setCourses((prev) =>
            prev.map((c) =>
              c.id === activeCourse.id
                ? { ...c, material_count: Math.max(0, c.material_count - 1) }
                : c,
            ),
          );
          fetchContext(activeCourse.id);
        }
      } catch (err) {
        console.error('[useTutorWorkspace] deleteMaterial:', err);
      }
    } else {
      const ws = loadLocal();
      const mat = ws.materials.find((m) => m.id === id);
      ws.materials = ws.materials.filter((m) => m.id !== id);
      if (mat) {
        const courseIdx = ws.courses.findIndex((c) => c.id === mat.course_id);
        if (courseIdx >= 0) ws.courses[courseIdx].material_count = Math.max(0, ws.courses[courseIdx].material_count - 1);
      }
      saveLocal(ws);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      if (activeCourse) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === activeCourse?.id
              ? { ...c, material_count: Math.max(0, c.material_count - 1) }
              : c,
          ),
        );
      }
    }
  }, [isAuthenticated, activeCourse, fetchContext]);

  const deleteCourse = useCallback(async (id: number) => {
    if (isAuthenticated) {
      try {
        await authClient.delete(API_ENDPOINTS.tutorCourse(id));
        setCourses((prev) => prev.filter((c) => c.id !== id));
        if (activeCourse?.id === id) {
          setActiveCourse(null);
        }
        if (activeSemester) {
          setSemesters((prev) =>
            prev.map((s) =>
              s.id === activeSemester.id
                ? { ...s, course_count: Math.max(0, s.course_count - 1) }
                : s,
            ),
          );
        }
      } catch (err) {
        console.error('[useTutorWorkspace] deleteCourse:', err);
      }
    } else {
      const ws = loadLocal();
      ws.courses = ws.courses.filter((c) => c.id !== id);
      ws.materials = ws.materials.filter((m) => m.course_id !== id);
      // Update semester course_count
      if (activeSemester) {
        const semIdx = ws.semesters.findIndex((s) => s.id === activeSemester.id);
        if (semIdx >= 0) ws.semesters[semIdx].course_count = Math.max(0, ws.semesters[semIdx].course_count - 1);
      }
      saveLocal(ws);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      setMaterials((prev) => prev.filter((m) => m.course_id !== id));
      if (activeCourse?.id === id) {
        setActiveCourse(null);
      }
      if (activeSemester) {
        setSemesters([...ws.semesters]);
      }
    }
  }, [isAuthenticated, activeCourse, activeSemester]);

  const deleteSemester = useCallback(async (id: number) => {
    if (isAuthenticated) {
      try {
        await authClient.delete(API_ENDPOINTS.tutorSemester(id));
        setSemesters((prev) => {
          const remaining = prev.filter((s) => s.id !== id);
          if (activeSemester?.id === id) {
            setActiveSemester(remaining.length > 0 ? remaining[0] : null);
          }
          return remaining;
        });
      } catch (err) {
        console.error('[useTutorWorkspace] deleteSemester:', err);
      }
    } else {
      const ws = loadLocal();
      // Remove semester and all its courses + materials
      const courseIds = ws.courses.filter((c) => c.semester_id === id).map((c) => c.id);
      ws.semesters = ws.semesters.filter((s) => s.id !== id);
      ws.courses = ws.courses.filter((c) => c.semester_id !== id);
      ws.materials = ws.materials.filter((m) => !courseIds.includes(m.course_id));
      saveLocal(ws);
      setSemesters([...ws.semesters]);
      if (activeSemester?.id === id) {
        setActiveSemester(ws.semesters.length > 0 ? ws.semesters[0] : null);
      }
    }
  }, [isAuthenticated, activeSemester]);

  const switchSemester = useCallback((id: number) => {
    const sem = semesters.find((s) => s.id === id);
    if (sem) setActiveSemester(sem);
  }, [semesters]);

  const selectCourse = useCallback((id: number | null) => {
    if (id === null) {
      setActiveCourse(null);
      return;
    }
    const course = courses.find((c) => c.id === id);
    if (course) setActiveCourse(course);
  }, [courses]);

  return {
    semesters,
    activeSemester,
    courses,
    activeCourse,
    materials,
    courseContext,
    isLoading,
    createSemester,
    createCourse,
    addMaterial,
    deleteMaterial,
    deleteCourse,
    deleteSemester,
    switchSemester,
    selectCourse,
  };
}
