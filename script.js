/**
 * EduPulse - Student Management System
 * Frontend Client Controller
 * Connected with Node.js Express REST API & MongoDB
 */

// Determine API Base URL dynamically
const API_BASE = (() => {
  const loc = window.location;
  if (!loc || loc.protocol === 'file:') {
    return 'http://localhost:5000';
  }
  // If frontend is served on another port (e.g. 5500 Live Server), target backend on port 5000
  if (loc.port && loc.port !== '5000') {
    return `${loc.protocol}//${loc.hostname || 'localhost'}:5000`;
  }
  return '';
})();

/**
 * Safe fetch helper that validates JSON responses and provides user-friendly errors
 */
async function safeFetchJson(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (netErr) {
    throw new Error('Cannot connect to backend server on port 5000. Please ensure "node server.js" is running.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error('Backend server did not return JSON. Please ensure "node server.js" is running on port 5000.');
    }
    throw new Error(`Server returned unexpected response (${res.status} ${res.statusText})`);
  }

  let data;
  try {
    data = await res.json();
  } catch (jsonErr) {
    throw new Error('Failed to parse server response as JSON.');
  }

  return { res, data };
}

// Application State
const state = {
  currentUser: null,
  activeTab: 'students',
  students: [],
  filteredStudents: [],
  filters: {
    search: '',
    department: 'All',
    status: 'All',
    sortBy: 'createdAt',
    order: 'desc',
  },
  currentEditingId: null,
  currentDeletingId: null,

  // Courses Module State
  courses: [],
  courseFilters: {
    search: '',
    department: 'All',
    status: 'All',
  },
  currentEditingCourseId: null,
  currentDeletingCourseId: null,

  // Attendance Module State
  attendance: [],
  attendanceFilters: {
    date: new Date().toISOString().slice(0, 10),
    courseCode: 'All',
    status: 'All',
  },

  // Reports Module State
  reportsData: null,
};

// Sample realistic avatar portrait collection
const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
];
let sampleAvatarIdx = 0;

// Auth Storage Keys
const AUTH_KEY = 'edupulse_auth_user';
const TOKEN_KEY = 'edupulse_auth_token';

// DOM Elements Cache
const elements = {
  // Views
  loginView: document.getElementById('loginView'),
  appLayout: document.getElementById('appLayout'),

  // Login Form elements
  loginForm: document.getElementById('loginForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  loginRememberMe: document.getElementById('loginRememberMe'),
  btnLoginSubmit: document.getElementById('btnLoginSubmit'),
  btnLoginSubmitText: document.getElementById('btnLoginSubmitText'),
  loginAlert: document.getElementById('loginAlert'),
  loginAlertText: document.getElementById('loginAlertText'),
  btnForgotPwd: document.getElementById('btnForgotPwd'),
  btnTogglePassword: document.getElementById('btnTogglePassword'),
  togglePwdIcon: document.getElementById('togglePwdIcon'),
  btnDemoAdmin: document.getElementById('btnDemoAdmin'),
  btnDemoStaff: document.getElementById('btnDemoStaff'),

  // Header user profile & logout
  userHeaderProfile: document.getElementById('userHeaderProfile'),
  userHeaderAvatar: document.getElementById('userHeaderAvatar'),
  userHeaderName: document.getElementById('userHeaderName'),
  userHeaderRole: document.getElementById('userHeaderRole'),
  btnLogout: document.getElementById('btnLogout'),

  // DB status
  dbDot: document.getElementById('dbDot'),
  dbText: document.getElementById('dbText'),
  btnRefreshHealth: document.getElementById('btnRefreshHealth'),

  // Stats
  statTotalStudents: document.getElementById('statTotalStudents'),
  statActiveStudents: document.getElementById('statActiveStudents'),
  statDepartments: document.getElementById('statDepartments'),
  statAvgGpa: document.getElementById('statAvgGpa'),

  // Controls & Toolbar
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  filterDepartment: document.getElementById('filterDepartment'),
  filterStatus: document.getElementById('filterStatus'),
  sortBy: document.getElementById('sortBy'),
  btnSortOrder: document.getElementById('btnSortOrder'),
  sortOrderIcon: document.getElementById('sortOrderIcon'),
  btnResetFilters: document.getElementById('btnResetFilters'),
  recordsCountText: document.getElementById('recordsCountText'),
  btnExportCsv: document.getElementById('btnExportCsv'),

  // Table & States
  studentsTableBody: document.getElementById('studentsTableBody'),
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  btnSeedData: document.getElementById('btnSeedData'),
  btnEmptySeed: document.getElementById('btnEmptySeed'),
  btnEmptyAdd: document.getElementById('btnEmptyAdd'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),

  // Add / Edit Modal
  studentModal: document.getElementById('studentModal'),
  studentForm: document.getElementById('studentForm'),
  modalTitle: document.getElementById('modalTitle'),
  modalSubtitle: document.getElementById('modalSubtitle'),
  modalHeaderIcon: document.getElementById('modalHeaderIcon'),
  editStudentDbId: document.getElementById('editStudentDbId'),
  btnSubmitStudent: document.getElementById('btnSubmitStudent'),
  btnSubmitText: document.getElementById('btnSubmitText'),
  btnCloseStudentModal: document.getElementById('btnCloseStudentModal'),
  btnCancelStudentModal: document.getElementById('btnCancelStudentModal'),

  // Student Photo Upload
  avatarPreviewCircle: document.getElementById('avatarPreviewCircle'),
  avatarPlaceholderIcon: document.getElementById('avatarPlaceholderIcon'),
  avatarPreviewImg: document.getElementById('avatarPreviewImg'),
  btnRemoveAvatar: document.getElementById('btnRemoveAvatar'),
  formAvatarFileInput: document.getElementById('formAvatarFileInput'),
  btnRandomAvatar: document.getElementById('btnRandomAvatar'),
  formAvatarUrl: document.getElementById('formAvatarUrl'),
  formAvatarData: document.getElementById('formAvatarData'),

  // Form Fields
  formStudentId: document.getElementById('formStudentId'),
  formFullName: document.getElementById('formFullName'),
  formEmail: document.getElementById('formEmail'),
  formPhone: document.getElementById('formPhone'),
  formDob: document.getElementById('formDob'),
  formGender: document.getElementById('formGender'),
  formDepartment: document.getElementById('formDepartment'),
  formYear: document.getElementById('formYear'),
  formSemester: document.getElementById('formSemester'),
  formGpa: document.getElementById('formGpa'),
  formStatus: document.getElementById('formStatus'),
  formAddress: document.getElementById('formAddress'),

  // Error indicators
  errStudentId: document.getElementById('errStudentId'),
  errFullName: document.getElementById('errFullName'),
  errEmail: document.getElementById('errEmail'),
  errPhone: document.getElementById('errPhone'),
  errDepartment: document.getElementById('errDepartment'),

  // View Modal
  viewModal: document.getElementById('viewModal'),
  viewModalContent: document.getElementById('viewModalContent'),
  btnCloseViewModal: document.getElementById('btnCloseViewModal'),
  btnCloseViewFooter: document.getElementById('btnCloseViewFooter'),
  btnEditFromView: document.getElementById('btnEditFromView'),

  // Delete Modal
  deleteModal: document.getElementById('deleteModal'),
  deleteStudentName: document.getElementById('deleteStudentName'),
  deleteStudentId: document.getElementById('deleteStudentId'),
  deleteStudentDbId: document.getElementById('deleteStudentDbId'),
  btnCancelDelete: document.getElementById('btnCancelDelete'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),

  // Navigation Tabs & Panes
  appNavTabs: document.getElementById('appNavTabs'),
  tabBtnStudents: document.getElementById('tabBtnStudents'),
  tabBtnCourses: document.getElementById('tabBtnCourses'),
  tabBtnAttendance: document.getElementById('tabBtnAttendance'),
  tabBtnReports: document.getElementById('tabBtnReports'),
  tabPaneStudents: document.getElementById('tabPaneStudents'),
  tabPaneCourses: document.getElementById('tabPaneCourses'),
  tabPaneAttendance: document.getElementById('tabPaneAttendance'),
  tabPaneReports: document.getElementById('tabPaneReports'),

  // Courses Module
  statTotalCourses: document.getElementById('statTotalCourses'),
  statActiveCourses: document.getElementById('statActiveCourses'),
  statCourseDepts: document.getElementById('statCourseDepts'),
  statTotalCredits: document.getElementById('statTotalCredits'),
  courseSearchInput: document.getElementById('courseSearchInput'),
  btnClearCourseSearch: document.getElementById('btnClearCourseSearch'),
  filterCourseDept: document.getElementById('filterCourseDept'),
  filterCourseStatus: document.getElementById('filterCourseStatus'),
  btnResetCourseFilters: document.getElementById('btnResetCourseFilters'),
  coursesCountText: document.getElementById('coursesCountText'),
  coursesTableBody: document.getElementById('coursesTableBody'),
  emptyStateCourses: document.getElementById('emptyStateCourses'),
  loadingStateCourses: document.getElementById('loadingStateCourses'),
  btnOpenAddCourseModal: document.getElementById('btnOpenAddCourseModal'),
  btnEmptyAddCourse: document.getElementById('btnEmptyAddCourse'),

  // Course Add/Edit Modal
  courseModal: document.getElementById('courseModal'),
  courseForm: document.getElementById('courseForm'),
  courseModalTitle: document.getElementById('courseModalTitle'),
  courseModalSubtitle: document.getElementById('courseModalSubtitle'),
  courseModalHeaderIcon: document.getElementById('courseModalHeaderIcon'),
  editCourseDbId: document.getElementById('editCourseDbId'),
  formCourseCode: document.getElementById('formCourseCode'),
  formCourseName: document.getElementById('formCourseName'),
  formCourseDept: document.getElementById('formCourseDept'),
  formCourseCredits: document.getElementById('formCourseCredits'),
  formCourseInstructor: document.getElementById('formCourseInstructor'),
  formCourseSemester: document.getElementById('formCourseSemester'),
  formCourseSchedule: document.getElementById('formCourseSchedule'),
  formCourseCapacity: document.getElementById('formCourseCapacity'),
  formCourseStatus: document.getElementById('formCourseStatus'),
  formCourseDesc: document.getElementById('formCourseDesc'),
  errCourseCode: document.getElementById('errCourseCode'),
  errCourseName: document.getElementById('errCourseName'),
  errCourseDept: document.getElementById('errCourseDept'),
  errCourseCredits: document.getElementById('errCourseCredits'),
  btnCloseCourseModal: document.getElementById('btnCloseCourseModal'),
  btnCancelCourseModal: document.getElementById('btnCancelCourseModal'),
  btnSubmitCourse: document.getElementById('btnSubmitCourse'),
  btnSubmitCourseText: document.getElementById('btnSubmitCourseText'),

  // Delete Course Modal
  deleteCourseModal: document.getElementById('deleteCourseModal'),
  deleteCourseName: document.getElementById('deleteCourseName'),
  deleteCourseCode: document.getElementById('deleteCourseCode'),
  deleteCourseDbId: document.getElementById('deleteCourseDbId'),
  btnCancelDeleteCourse: document.getElementById('btnCancelDeleteCourse'),
  btnConfirmDeleteCourse: document.getElementById('btnConfirmDeleteCourse'),

  // Attendance Module
  statAttendanceRate: document.getElementById('statAttendanceRate'),
  statAttendancePresent: document.getElementById('statAttendancePresent'),
  statAttendanceLateExcused: document.getElementById('statAttendanceLateExcused'),
  statAttendanceAbsent: document.getElementById('statAttendanceAbsent'),
  attendanceDateFilter: document.getElementById('attendanceDateFilter'),
  attendanceCourseSelect: document.getElementById('attendanceCourseSelect'),
  attendanceStatusFilter: document.getElementById('attendanceStatusFilter'),
  attendanceCountText: document.getElementById('attendanceCountText'),
  btnResetAttendanceFilter: document.getElementById('btnResetAttendanceFilter'),
  btnExportAttendanceCsv: document.getElementById('btnExportAttendanceCsv'),
  btnOpenMarkAttendanceModal: document.getElementById('btnOpenMarkAttendanceModal'),
  btnEmptyMarkAttendance: document.getElementById('btnEmptyMarkAttendance'),
  attendanceTableBody: document.getElementById('attendanceTableBody'),
  emptyStateAttendance: document.getElementById('emptyStateAttendance'),
  loadingStateAttendance: document.getElementById('loadingStateAttendance'),

  // Attendance Batch Modal
  attendanceModal: document.getElementById('attendanceModal'),
  attendanceBatchForm: document.getElementById('attendanceBatchForm'),
  batchCourseSelect: document.getElementById('batchCourseSelect'),
  batchDateInput: document.getElementById('batchDateInput'),
  btnBatchMarkAllPresent: document.getElementById('btnBatchMarkAllPresent'),
  batchStudentsRoster: document.getElementById('batchStudentsRoster'),
  batchRosterCount: document.getElementById('batchRosterCount'),
  btnCloseAttendanceModal: document.getElementById('btnCloseAttendanceModal'),
  btnCancelAttendanceModal: document.getElementById('btnCancelAttendanceModal'),
  btnSaveAttendanceBatch: document.getElementById('btnSaveAttendanceBatch'),
  btnSaveAttendanceBatchText: document.getElementById('btnSaveAttendanceBatchText'),

  // Reports Module
  btnRefreshReports: document.getElementById('btnRefreshReports'),
  btnExportReportsCsv: document.getElementById('btnExportReportsCsv'),
  btnPrintReport: document.getElementById('btnPrintReport'),
  reportAvgGpa: document.getElementById('reportAvgGpa'),
  reportDeansList: document.getElementById('reportDeansList'),
  reportAttendanceRate: document.getElementById('reportAttendanceRate'),
  reportAtRiskCount: document.getElementById('reportAtRiskCount'),
  gpaDistributionBars: document.getElementById('gpaDistributionBars'),
  attendanceComplianceBars: document.getElementById('attendanceComplianceBars'),
  departmentReportTableBody: document.getElementById('departmentReportTableBody'),
  honorRollTableBody: document.getElementById('honorRollTableBody'),
  atRiskStudentsContainer: document.getElementById('atRiskStudentsContainer'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer'),

  // Academic Background Theme Switcher
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  themeDropdownMenu: document.getElementById('themeDropdownMenu'),
  themeToggleText: document.getElementById('themeToggleText'),
};

// ============================================================================
// Academic Background Theme Controller
// ============================================================================
const THEME_KEY = 'edupulse_academic_theme';

const THEME_NAMES = {
  'academic-blue': 'Academic Blue',
  'royal-navy': 'Royal Navy',
  'ivy-league': 'Ivy League',
  'crimson-crest': 'Crimson Crest',
  'midnight-campus': 'Midnight Campus',
};

function initAcademicTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'academic-blue';
  setAcademicTheme(saved, false);

  const toggles = [
    { btn: elements.btnThemeToggle, menu: elements.themeDropdownMenu },
    { btn: document.getElementById('btnLoginThemeToggle'), menu: document.getElementById('loginThemeDropdownMenu') },
  ];

  toggles.forEach(({ btn, menu }) => {
    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = menu.style.display === 'flex';
        toggles.forEach((t) => t.menu && (t.menu.style.display = 'none'));
        menu.style.display = isVisible ? 'none' : 'flex';
      });

      menu.querySelectorAll('.theme-option').forEach((opt) => {
        opt.addEventListener('click', () => {
          const theme = opt.dataset.theme;
          if (theme) {
            setAcademicTheme(theme, true);
            menu.style.display = 'none';
          }
        });
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-dropdown-wrap')) {
      toggles.forEach((t) => t.menu && (t.menu.style.display = 'none'));
    }
  });
}

function setAcademicTheme(themeName, showToastNotice = false) {
  document.documentElement.dataset.theme = themeName;
  localStorage.setItem(THEME_KEY, themeName);

  const displayTitle = THEME_NAMES[themeName] || 'Theme';
  if (elements.themeToggleText) {
    elements.themeToggleText.textContent = displayTitle;
  }
  const loginText = document.getElementById('loginThemeToggleText');
  if (loginText) {
    loginText.textContent = displayTitle;
  }

  document.querySelectorAll('.theme-dropdown-menu .theme-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.theme === themeName);
  });

  if (showToastNotice) {
    showToast(`Campus theme set to ${displayTitle}`, 'info', 2200);
  }
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Academic Background Theme
  initAcademicTheme();

  // Check stored authentication
  state.currentUser = getStoredAuth();
  updateAuthUI();

  initEventListeners();
  initAuthEventListeners();
  initAvatarEventListeners();

  if (state.currentUser) {
    checkDbHealth();
    fetchStats();
    fetchStudents();
  }

  // Periodic health check every 45s
  setInterval(() => {
    if (state.currentUser) checkDbHealth();
  }, 45000);
});

// ============================================================================
// Event Listeners
// ============================================================================
function initEventListeners() {
  // DB Health refresh
  elements.btnRefreshHealth.addEventListener('click', () => {
    checkDbHealth(true);
  });

  // Search input debounced
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    elements.btnClearSearch.style.display = e.target.value ? 'block' : 'none';
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      fetchStudents();
    }, 300);
  });

  elements.btnClearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.style.display = 'none';
    state.filters.search = '';
    fetchStudents();
  });

  // Department filter
  elements.filterDepartment.addEventListener('change', (e) => {
    state.filters.department = e.target.value;
    updateResetButtonVisibility();
    fetchStudents();
  });

  // Status filter
  elements.filterStatus.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    updateResetButtonVisibility();
    fetchStudents();
  });

  // Sort by
  elements.sortBy.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    fetchStudents();
  });

  // Sort order toggle
  elements.btnSortOrder.addEventListener('click', () => {
    state.filters.order = state.filters.order === 'asc' ? 'desc' : 'asc';
    elements.sortOrderIcon.className = state.filters.order === 'asc'
      ? 'fa-solid fa-arrow-up-short-wide'
      : 'fa-solid fa-arrow-down-wide-short';
    fetchStudents();
  });

  // Reset filters
  elements.btnResetFilters.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.btnClearSearch.style.display = 'none';
    elements.filterDepartment.value = 'All';
    elements.filterStatus.value = 'All';
    elements.sortBy.value = 'createdAt';
    state.filters.search = '';
    state.filters.department = 'All';
    state.filters.status = 'All';
    state.filters.sortBy = 'createdAt';
    state.filters.order = 'desc';
    elements.sortOrderIcon.className = 'fa-solid fa-arrow-down-wide-short';
    updateResetButtonVisibility();
    fetchStudents();
  });

  // Seed demo data buttons
  elements.btnSeedData.addEventListener('click', seedSampleData);
  elements.btnEmptySeed.addEventListener('click', seedSampleData);

  // Open Add Modal
  elements.btnOpenAddModal.addEventListener('click', () => openStudentModal('add'));
  elements.btnEmptyAdd.addEventListener('click', () => openStudentModal('add'));

  // Close Student Modal
  elements.btnCloseStudentModal.addEventListener('click', closeStudentModal);
  elements.btnCancelStudentModal.addEventListener('click', closeStudentModal);

  // Form Submit (Create or Update)
  elements.studentForm.addEventListener('submit', handleFormSubmit);

  // View Modal Close
  elements.btnCloseViewModal.addEventListener('click', closeViewModal);
  elements.btnCloseViewFooter.addEventListener('click', closeViewModal);

  // Edit from View Modal
  elements.btnEditFromView.addEventListener('click', () => {
    const studentId = elements.btnEditFromView.dataset.studentId;
    closeViewModal();
    if (studentId) {
      const student = state.students.find((s) => s._id === studentId);
      if (student) openStudentModal('edit', student);
    }
  });

  // Delete Modal Actions
  elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
  elements.btnConfirmDelete.addEventListener('click', executeDeleteStudent);

  // Export CSV
  elements.btnExportCsv.addEventListener('click', exportToCsv);

  // Navigation Tabs switching
  if (elements.appNavTabs) {
    elements.appNavTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-tab-btn');
      if (btn && btn.dataset.tab) {
        switchTab(btn.dataset.tab);
      }
    });
  }

  // Courses Module Listeners
  if (elements.btnOpenAddCourseModal) {
    elements.btnOpenAddCourseModal.addEventListener('click', () => openCourseModal('add'));
  }
  if (elements.btnEmptyAddCourse) {
    elements.btnEmptyAddCourse.addEventListener('click', () => openCourseModal('add'));
  }
  if (elements.btnCloseCourseModal) {
    elements.btnCloseCourseModal.addEventListener('click', closeCourseModal);
  }
  if (elements.btnCancelCourseModal) {
    elements.btnCancelCourseModal.addEventListener('click', closeCourseModal);
  }
  if (elements.courseForm) {
    elements.courseForm.addEventListener('submit', handleCourseSubmit);
  }
  if (elements.courseSearchInput) {
    let courseSearchTimeout;
    elements.courseSearchInput.addEventListener('input', (e) => {
      clearTimeout(courseSearchTimeout);
      elements.btnClearCourseSearch.style.display = e.target.value ? 'block' : 'none';
      courseSearchTimeout = setTimeout(() => {
        state.courseFilters.search = e.target.value.trim();
        fetchCourses();
      }, 300);
    });
  }
  if (elements.btnClearCourseSearch) {
    elements.btnClearCourseSearch.addEventListener('click', () => {
      elements.courseSearchInput.value = '';
      elements.btnClearCourseSearch.style.display = 'none';
      state.courseFilters.search = '';
      fetchCourses();
    });
  }
  if (elements.filterCourseDept) {
    elements.filterCourseDept.addEventListener('change', (e) => {
      state.courseFilters.department = e.target.value;
      if (elements.btnResetCourseFilters) {
        elements.btnResetCourseFilters.style.display = (e.target.value !== 'All' || state.courseFilters.status !== 'All') ? 'inline-flex' : 'none';
      }
      fetchCourses();
    });
  }
  if (elements.filterCourseStatus) {
    elements.filterCourseStatus.addEventListener('change', (e) => {
      state.courseFilters.status = e.target.value;
      if (elements.btnResetCourseFilters) {
        elements.btnResetCourseFilters.style.display = (e.target.value !== 'All' || state.courseFilters.department !== 'All') ? 'inline-flex' : 'none';
      }
      fetchCourses();
    });
  }
  if (elements.btnResetCourseFilters) {
    elements.btnResetCourseFilters.addEventListener('click', () => {
      elements.courseSearchInput.value = '';
      elements.btnClearCourseSearch.style.display = 'none';
      elements.filterCourseDept.value = 'All';
      elements.filterCourseStatus.value = 'All';
      state.courseFilters.search = '';
      state.courseFilters.department = 'All';
      state.courseFilters.status = 'All';
      elements.btnResetCourseFilters.style.display = 'none';
      fetchCourses();
    });
  }
  if (elements.btnCancelDeleteCourse) {
    elements.btnCancelDeleteCourse.addEventListener('click', closeDeleteCourseModal);
  }
  if (elements.btnConfirmDeleteCourse) {
    elements.btnConfirmDeleteCourse.addEventListener('click', executeDeleteCourse);
  }

  // Attendance Module Listeners
  if (elements.attendanceDateFilter) {
    elements.attendanceDateFilter.value = state.attendanceFilters.date;
    elements.attendanceDateFilter.addEventListener('change', (e) => {
      state.attendanceFilters.date = e.target.value;
      updateResetAttendanceFilterVisibility();
      fetchAttendance();
    });
  }
  if (elements.attendanceCourseSelect) {
    elements.attendanceCourseSelect.addEventListener('change', (e) => {
      state.attendanceFilters.courseCode = e.target.value;
      updateResetAttendanceFilterVisibility();
      fetchAttendance();
    });
  }
  if (elements.attendanceStatusFilter) {
    elements.attendanceStatusFilter.addEventListener('change', (e) => {
      state.attendanceFilters.status = e.target.value;
      updateResetAttendanceFilterVisibility();
      fetchAttendance();
    });
  }
  if (elements.btnResetAttendanceFilter) {
    elements.btnResetAttendanceFilter.addEventListener('click', () => {
      state.attendanceFilters.date = '';
      state.attendanceFilters.courseCode = 'All';
      state.attendanceFilters.status = 'All';
      if (elements.attendanceDateFilter) elements.attendanceDateFilter.value = '';
      if (elements.attendanceCourseSelect) elements.attendanceCourseSelect.value = 'All';
      if (elements.attendanceStatusFilter) elements.attendanceStatusFilter.value = 'All';
      elements.btnResetAttendanceFilter.style.display = 'none';
      fetchAttendance();
    });
  }
  if (elements.btnOpenMarkAttendanceModal) {
    elements.btnOpenMarkAttendanceModal.addEventListener('click', openMarkAttendanceModal);
  }
  if (elements.btnEmptyMarkAttendance) {
    elements.btnEmptyMarkAttendance.addEventListener('click', openMarkAttendanceModal);
  }
  if (elements.btnCloseAttendanceModal) {
    elements.btnCloseAttendanceModal.addEventListener('click', closeMarkAttendanceModal);
  }
  if (elements.btnCancelAttendanceModal) {
    elements.btnCancelAttendanceModal.addEventListener('click', closeMarkAttendanceModal);
  }
  if (elements.attendanceBatchForm) {
    elements.attendanceBatchForm.addEventListener('submit', handleAttendanceBatchSubmit);
  }
  if (elements.btnBatchMarkAllPresent) {
    elements.btnBatchMarkAllPresent.addEventListener('click', markAllBatchPresent);
  }
  if (elements.btnExportAttendanceCsv) {
    elements.btnExportAttendanceCsv.addEventListener('click', exportAttendanceToCsv);
  }

  // Reports Module Listeners
  if (elements.btnRefreshReports) {
    elements.btnRefreshReports.addEventListener('click', () => fetchReports(true));
  }
  if (elements.btnExportReportsCsv) {
    elements.btnExportReportsCsv.addEventListener('click', exportReportsToCsv);
  }
  if (elements.btnPrintReport) {
    elements.btnPrintReport.addEventListener('click', () => window.print());
  }

  // Close modals on clicking overlay background
  [
    elements.studentModal,
    elements.viewModal,
    elements.deleteModal,
    elements.courseModal,
    elements.deleteCourseModal,
    elements.attendanceModal,
  ].forEach((modal) => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [
        elements.studentModal,
        elements.viewModal,
        elements.deleteModal,
        elements.courseModal,
        elements.deleteCourseModal,
        elements.attendanceModal,
      ].forEach((m) => m && m.classList.remove('active'));
    }
  });
}

// ============================================================================
// Authentication Controller
// ============================================================================
function getStoredAuth() {
  const local = localStorage.getItem(AUTH_KEY);
  const session = sessionStorage.getItem(AUTH_KEY);
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  if (session) {
    try { return JSON.parse(session); } catch (e) {}
  }
  return null;
}

function saveAuth(user, token, remember = true) {
  state.currentUser = user;
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_KEY, JSON.stringify(user));
  if (token) storage.setItem(TOKEN_KEY, token);
}

function clearAuth() {
  state.currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function updateAuthUI() {
  if (state.currentUser) {
    elements.loginView.style.display = 'none';
    elements.appLayout.style.display = 'flex';
    elements.userHeaderName.textContent = state.currentUser.name || state.currentUser.username;
    elements.userHeaderRole.textContent = state.currentUser.role || 'Administrator';
    if (state.currentUser.avatar) {
      elements.userHeaderAvatar.src = state.currentUser.avatar;
    }
  } else {
    elements.appLayout.style.display = 'none';
    elements.loginView.style.display = 'flex';
  }
}

function showLoginAlert(msg) {
  elements.loginAlertText.textContent = msg;
  elements.loginAlert.style.display = 'flex';
}

function initAuthEventListeners() {
  // Login form submit
  elements.loginForm.addEventListener('submit', handleLoginSubmit);

  // Toggle password visibility
  elements.btnTogglePassword.addEventListener('click', () => {
    const isPassword = elements.loginPassword.type === 'password';
    elements.loginPassword.type = isPassword ? 'text' : 'password';
    elements.togglePwdIcon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });

  // Forgot password / Help
  elements.btnForgotPwd.addEventListener('click', () => {
    showToast('Demo Credentials: admin / admin123 (Administrator) or staff / staff123 (Faculty Staff)', 'info', 6000);
  });

  // Demo accounts autofill & submit
  elements.btnDemoAdmin.addEventListener('click', () => {
    elements.loginUsername.value = 'admin';
    elements.loginPassword.value = 'admin123';
    elements.loginAlert.style.display = 'none';
    elements.loginForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });

  elements.btnDemoStaff.addEventListener('click', () => {
    elements.loginUsername.value = 'staff';
    elements.loginPassword.value = 'staff123';
    elements.loginAlert.style.display = 'none';
    elements.loginForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });

  // Logout button
  elements.btnLogout.addEventListener('click', () => {
    clearAuth();
    updateAuthUI();
    showToast('You have signed out successfully.', 'info');
  });
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  elements.loginAlert.style.display = 'none';

  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;
  const remember = elements.loginRememberMe.checked;

  if (!username || !password) {
    showLoginAlert('Please enter both username/email and password.');
    return;
  }

  try {
    elements.btnLoginSubmit.disabled = true;
    elements.btnLoginSubmitText.textContent = 'Verifying credentials...';

    const { res, data } = await safeFetchJson(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed. Please verify credentials.');
    }

    saveAuth(data.user, data.token, remember);
    updateAuthUI();
    showToast(`Signed in as ${data.user.name} (${data.user.role})`, 'success');

    // Trigger data loading upon login
    checkDbHealth();
    fetchStats();
    fetchStudents();
  } catch (err) {
    let msg = err.message || 'Unable to connect to login server.';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Cannot connect to backend server on port 5000. Please ensure "node server.js" is running.';
    }
    showLoginAlert(msg);
  } finally {
    elements.btnLoginSubmit.disabled = false;
    elements.btnLoginSubmitText.textContent = 'Sign In to Dashboard';
  }
}

// ============================================================================
// Student Photo / Avatar Controller
// ============================================================================
function setAvatarPreview(src) {
  const url = (src || '').trim();
  if (url) {
    elements.avatarPreviewImg.src = url;
    elements.avatarPreviewImg.style.display = 'block';
    elements.avatarPlaceholderIcon.style.display = 'none';
    elements.btnRemoveAvatar.style.display = 'flex';
    elements.formAvatarData.value = url;
  } else {
    elements.avatarPreviewImg.src = '';
    elements.avatarPreviewImg.style.display = 'none';
    elements.avatarPlaceholderIcon.style.display = 'block';
    elements.btnRemoveAvatar.style.display = 'none';
    elements.formAvatarData.value = '';
    elements.formAvatarUrl.value = '';
    elements.formAvatarFileInput.value = '';
  }
}

function initAvatarEventListeners() {
  // File upload input
  elements.formAvatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target.result;
      elements.formAvatarUrl.value = '';
      setAvatarPreview(dataUri);
      showToast('Student photo uploaded successfully', 'success', 2500);
    };
    reader.readAsDataURL(file);
  });

  // URL input field
  elements.formAvatarUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      setAvatarPreview(url);
    }
  });

  // Sample portrait generator
  elements.btnRandomAvatar.addEventListener('click', () => {
    const sample = SAMPLE_AVATARS[sampleAvatarIdx % SAMPLE_AVATARS.length];
    sampleAvatarIdx++;
    elements.formAvatarUrl.value = sample;
    setAvatarPreview(sample);
    showToast('Sample student portrait applied', 'info', 2000);
  });

  // Remove photo button
  elements.btnRemoveAvatar.addEventListener('click', () => {
    setAvatarPreview('');
    showToast('Photo removed', 'info', 2000);
  });
}

function updateResetButtonVisibility() {
  const isFiltered = state.filters.search !== '' ||
                     state.filters.department !== 'All' ||
                     state.filters.status !== 'All' ||
                     state.filters.sortBy !== 'createdAt';
  elements.btnResetFilters.style.display = isFiltered ? 'inline-flex' : 'none';
}

// ============================================================================
// API Calls: Health & Stats
// ============================================================================
async function checkDbHealth(showToastNotice = false) {
  try {
    const { res, data } = await safeFetchJson(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error('API server unreachable');

    if (data.database === 'Connected') {
      elements.dbDot.className = 'status-indicator online';
      elements.dbText.textContent = 'MongoDB Online';
      if (showToastNotice) showToast('MongoDB connection healthy and verified', 'success');
    } else {
      elements.dbDot.className = 'status-indicator connecting';
      elements.dbText.textContent = `MongoDB: ${data.database}`;
      if (showToastNotice) showToast(`MongoDB Status: ${data.database}`, 'warning');
    }
  } catch (error) {
    elements.dbDot.className = 'status-indicator offline';
    elements.dbText.textContent = 'DB Disconnected';
    if (showToastNotice) {
      showToast('Cannot connect to server or MongoDB. Ensure server.js is running.', 'error');
    }
  }
}

async function fetchStats() {
  try {
    const { res, data: stats } = await safeFetchJson(`${API_BASE}/api/stats`);
    if (!res.ok) return;

    elements.statTotalStudents.textContent = stats.totalStudents ?? 0;
    elements.statActiveStudents.textContent = stats.activeStudents ?? 0;
    elements.statDepartments.textContent = stats.departmentCount ?? 0;
    elements.statAvgGpa.textContent = stats.avgGpa ?? '0.00';
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

// ============================================================================
// API Calls: Students CRUD
// ============================================================================
async function fetchStudents() {
  showLoading(true);

  try {
    const params = new URLSearchParams({
      search: state.filters.search,
      department: state.filters.department,
      status: state.filters.status,
      sortBy: state.filters.sortBy,
      order: state.filters.order,
    });

    const { res, data: students } = await safeFetchJson(`${API_BASE}/api/students?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to load students (${res.status})`);
    }

    state.students = Array.isArray(students) ? students : [];

    renderStudentsTable(state.students);
    updateRecordsCount(state.students.length);
  } catch (err) {
    console.error('Fetch error:', err);
    showToast(err.message || 'Failed to connect to backend server. Make sure node server.js is running.', 'error');
    renderStudentsTable([]);
  } finally {
    showLoading(false);
  }
}

async function seedSampleData() {
  try {
    elements.btnSeedData.disabled = true;
    showToast('Seeding demo student records into MongoDB...', 'info');

    const { res, data } = await safeFetchJson(`${API_BASE}/api/seed`, { method: 'POST' });

    if (!res.ok) throw new Error(data.error || 'Failed to seed');

    showToast(`Success! ${data.count} demo students loaded into MongoDB.`, 'success');
    fetchStats();
    fetchStudents();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.btnSeedData.disabled = false;
  }
}

// ============================================================================
// Render Table & UI Elements
// ============================================================================
function renderStudentsTable(students) {
  elements.studentsTableBody.innerHTML = '';

  if (!students || students.length === 0) {
    elements.emptyState.style.display = 'flex';
    if (state.filters.search || state.filters.department !== 'All' || state.filters.status !== 'All') {
      document.getElementById('emptyStateTitle').textContent = 'No Matches Found';
      document.getElementById('emptyStateDesc').textContent = 'Try adjusting or clearing your search and filter criteria.';
    } else {
      document.getElementById('emptyStateTitle').textContent = 'No Students in Database';
      document.getElementById('emptyStateDesc').textContent = 'Your MongoDB collection is empty. Add a new student or seed sample records!';
    }
    return;
  }

  elements.emptyState.style.display = 'none';

  students.forEach((student) => {
    const tr = document.createElement('tr');
    tr.dataset.id = student._id;

    // Avatar initials
    const initials = student.fullName
      ? student.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
      : 'ST';

    // Status Pill Class
    const statusClass = `status-${(student.status || 'active').toLowerCase()}`;

    // GPA Class
    const gpaNum = Number(student.gpa) || 0;
    let gpaClass = 'gpa-low';
    if (gpaNum >= 3.5 || gpaNum >= 8.5) gpaClass = 'gpa-high';
    else if (gpaNum >= 2.8 || gpaNum >= 6.5) gpaClass = 'gpa-mid';

    // Avatar image or initials fallback
    const avatarHtml = student.avatar
      ? `<img src="${escapeHtml(student.avatar)}" alt="${escapeHtml(student.fullName)}" class="avatar-img" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';" />`
      : escapeHtml(initials);

    tr.innerHTML = `
      <td>
        <span class="badge-id">${escapeHtml(student.studentId)}</span>
      </td>
      <td>
        <div class="student-info-cell">
          <div class="avatar">${avatarHtml}</div>
          <div class="student-text">
            <span class="student-name">${escapeHtml(student.fullName)}</span>
            <span class="student-gender">${escapeHtml(student.gender || 'Not specified')}</span>
          </div>
        </div>
      </td>
      <td>
        <div class="contact-cell">
          <a href="mailto:${escapeHtml(student.email)}" title="Send Email">
            <i class="fa-regular fa-envelope"></i> ${escapeHtml(student.email)}
          </a>
          <a href="tel:${escapeHtml(student.phone)}" title="Call Phone">
            <i class="fa-solid fa-phone"></i> ${escapeHtml(student.phone)}
          </a>
        </div>
      </td>
      <td>
        <div class="academic-cell">
          <span class="dept-name">${escapeHtml(student.department)}</span>
          <span class="year-sem">${escapeHtml(student.year || '1st Year')} &bull; ${escapeHtml(student.semester || 'Semester 1')}</span>
        </div>
      </td>
      <td>
        <span class="gpa-pill ${gpaClass}">
          <i class="fa-solid fa-star" style="font-size: 0.65rem;"></i> ${gpaNum.toFixed(2)}
        </span>
      </td>
      <td>
        <span class="status-pill ${statusClass}">
          <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> ${escapeHtml(student.status || 'Active')}
        </span>
      </td>
      <td class="text-right">
        <div class="row-actions">
          <button class="btn-action btn-view" title="View Profile" data-action="view" data-id="${student._id}">
            <i class="fa-regular fa-eye"></i>
          </button>
          <button class="btn-action btn-edit" title="Edit Student" data-action="edit" data-id="${student._id}">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="btn-action btn-delete" title="Delete Student" data-action="delete" data-id="${student._id}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    // Row action event delegation
    tr.querySelector('[data-action="view"]').addEventListener('click', () => viewStudentDetails(student));
    tr.querySelector('[data-action="edit"]').addEventListener('click', () => openStudentModal('edit', student));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => openDeleteModal(student));

    elements.studentsTableBody.appendChild(tr);
  });
}

function updateRecordsCount(count) {
  const isFiltered = state.filters.search !== '' ||
                     state.filters.department !== 'All' ||
                     state.filters.status !== 'All';
  if (isFiltered) {
    elements.recordsCountText.textContent = `Showing ${count} filtered student records`;
  } else {
    elements.recordsCountText.textContent = `Total of ${count} students registered in database`;
  }
}

function showLoading(isLoading) {
  elements.loadingState.style.display = isLoading ? 'flex' : 'none';
  if (isLoading) {
    elements.emptyState.style.display = 'none';
  }
}

// ============================================================================
// Student Add / Edit Modal Logic
// ============================================================================
function openStudentModal(mode = 'add', student = null) {
  clearFormErrors();
  elements.studentForm.reset();

  if (mode === 'edit' && student) {
    state.currentEditingId = student._id;
    elements.editStudentDbId.value = student._id;
    elements.modalTitle.textContent = 'Edit Student Record';
    elements.modalSubtitle.textContent = `Updating MongoDB document for ${student.fullName}`;
    elements.modalHeaderIcon.innerHTML = '<i class="fa-solid fa-user-pen"></i>';
    elements.btnSubmitText.textContent = 'Update Student';

    // Populate values
    elements.formStudentId.value = student.studentId || '';
    elements.formFullName.value = student.fullName || '';
    elements.formEmail.value = student.email || '';
    elements.formPhone.value = student.phone || '';
    elements.formDob.value = student.dob || '';
    elements.formGender.value = student.gender || 'Male';
    elements.formDepartment.value = student.department || '';
    elements.formYear.value = student.year || '1st Year';
    elements.formSemester.value = student.semester || 'Semester 1';
    elements.formGpa.value = student.gpa !== undefined ? student.gpa : '';
    elements.formStatus.value = student.status || 'Active';
    elements.formAddress.value = student.address || '';

    // Student avatar
    setAvatarPreview(student.avatar || '');
    if (student.avatar && student.avatar.startsWith('http')) {
      elements.formAvatarUrl.value = student.avatar;
    }
  } else {
    state.currentEditingId = null;
    elements.editStudentDbId.value = '';
    elements.modalTitle.textContent = 'Add New Student';
    elements.modalSubtitle.textContent = 'Fill in student details to store in MongoDB';
    elements.modalHeaderIcon.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
    elements.btnSubmitText.textContent = 'Save Student';

    // Generate suggested Student ID (e.g. STU-2024-XXX)
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    elements.formStudentId.value = `STU-2026-${randomSuffix}`;
    elements.formStatus.value = 'Active';
    elements.formYear.value = '1st Year';
    elements.formSemester.value = 'Semester 1';
    elements.formGender.value = 'Male';

    // Reset avatar
    setAvatarPreview('');
  }

  elements.studentModal.classList.add('active');
  elements.formFullName.focus();
}

function closeStudentModal() {
  elements.studentModal.classList.remove('active');
  elements.studentForm.reset();
  setAvatarPreview('');
  state.currentEditingId = null;
  clearFormErrors();
}

function clearFormErrors() {
  elements.errStudentId.textContent = '';
  elements.errFullName.textContent = '';
  elements.errEmail.textContent = '';
  elements.errPhone.textContent = '';
  elements.errDepartment.textContent = '';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const studentData = {
    studentId: elements.formStudentId.value.trim().toUpperCase(),
    fullName: elements.formFullName.value.trim(),
    email: elements.formEmail.value.trim(),
    phone: elements.formPhone.value.trim(),
    dob: elements.formDob.value,
    gender: elements.formGender.value,
    department: elements.formDepartment.value,
    year: elements.formYear.value,
    semester: elements.formSemester.value,
    gpa: parseFloat(elements.formGpa.value) || 0,
    status: elements.formStatus.value,
    address: elements.formAddress.value.trim(),
    avatar: (elements.formAvatarData.value || '').trim(),
  };

  // Basic Validation
  let hasError = false;
  if (!studentData.studentId) {
    elements.errStudentId.textContent = 'Student ID is required';
    hasError = true;
  }
  if (!studentData.fullName) {
    elements.errFullName.textContent = 'Full Name is required';
    hasError = true;
  }
  if (!studentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) {
    elements.errEmail.textContent = 'Valid email is required';
    hasError = true;
  }
  if (!studentData.phone) {
    elements.errPhone.textContent = 'Phone number is required';
    hasError = true;
  }
  if (!studentData.department) {
    elements.errDepartment.textContent = 'Please select a department';
    hasError = true;
  }

  if (hasError) return;

  const isEdit = Boolean(state.currentEditingId);
  try {
    elements.btnSubmitStudent.disabled = true;
    elements.btnSubmitText.textContent = isEdit ? 'Updating Student...' : 'Saving Student...';
    
    const url = isEdit
      ? `${API_BASE}/api/students/${state.currentEditingId}`
      : `${API_BASE}/api/students`;
    const method = isEdit ? 'PUT' : 'POST';

    const { res, data: result } = await safeFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });

    if (!res.ok) {
      throw new Error(result.error || 'Failed to save student record');
    }

    showToast(
      isEdit
        ? `Student ${result.fullName} updated successfully!`
        : `New Student ${result.fullName} successfully registered in MongoDB!`,
      'success'
    );

    closeStudentModal();
    fetchStats();
    fetchStudents();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.btnSubmitStudent.disabled = false;
    elements.btnSubmitText.textContent = isEdit ? 'Update Student' : 'Save Student';
  }
}

// ============================================================================
// View Details Modal Logic
// ============================================================================
function viewStudentDetails(student) {
  const initials = student.fullName
    ? student.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : 'ST';

  const gpaNum = Number(student.gpa) || 0;
  let gpaClass = 'gpa-low';
  if (gpaNum >= 3.5 || gpaNum >= 8.5) gpaClass = 'gpa-high';
  else if (gpaNum >= 2.8 || gpaNum >= 6.5) gpaClass = 'gpa-mid';

  const statusClass = `status-${(student.status || 'active').toLowerCase()}`;
  const enrolledDate = student.createdAt
    ? new Date(student.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const avatarLgHtml = student.avatar
    ? `<img src="${escapeHtml(student.avatar)}" alt="${escapeHtml(student.fullName)}" class="profile-avatar-lg-img" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';" />`
    : escapeHtml(initials);

  elements.viewModalContent.innerHTML = `
    <div class="profile-overview-header">
      <div class="profile-avatar-lg">${avatarLgHtml}</div>
      <div class="profile-info-main">
        <h4>${escapeHtml(student.fullName)}</h4>
        <div class="profile-meta">
          <span class="badge-id">${escapeHtml(student.studentId)}</span>
          <span class="status-pill ${statusClass}">${escapeHtml(student.status || 'Active')}</span>
          <span class="gpa-pill ${gpaClass}">GPA: ${gpaNum.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <div class="profile-item">
        <div class="profile-item-label">Email Address</div>
        <div class="profile-item-value">
          <a href="mailto:${escapeHtml(student.email)}" style="color: var(--primary); text-decoration: none;">
            ${escapeHtml(student.email)}
          </a>
        </div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Phone Number</div>
        <div class="profile-item-value">${escapeHtml(student.phone || 'N/A')}</div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Department / Major</div>
        <div class="profile-item-value">${escapeHtml(student.department)}</div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Academic Progress</div>
        <div class="profile-item-value">${escapeHtml(student.year || '1st Year')} &bull; ${escapeHtml(student.semester || 'Semester 1')}</div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Gender</div>
        <div class="profile-item-value">${escapeHtml(student.gender || 'Not specified')}</div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Date of Birth</div>
        <div class="profile-item-value">${student.dob || 'Not provided'}</div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Enrolled Date</div>
        <div class="profile-item-value">${enrolledDate}</div>
      </div>

      <div class="profile-item">
        <div class="profile-item-label">Database Record ID</div>
        <div class="profile-item-value" style="font-family: monospace; font-size: 0.8rem; color: var(--text-secondary);">
          ${student._id}
        </div>
      </div>

      <div class="profile-item full">
        <div class="profile-item-label">Residential Address</div>
        <div class="profile-item-value">${escapeHtml(student.address || 'No physical address provided on file.')}</div>
      </div>
    </div>
  `;

  elements.btnEditFromView.dataset.studentId = student._id;
  elements.viewModal.classList.add('active');
}

function closeViewModal() {
  elements.viewModal.classList.remove('active');
}

// ============================================================================
// Delete Confirmation Modal Logic
// ============================================================================
function openDeleteModal(student) {
  state.currentDeletingId = student._id;
  elements.deleteStudentName.textContent = student.fullName;
  elements.deleteStudentId.textContent = student.studentId;
  elements.deleteStudentDbId.value = student._id;
  elements.deleteModal.classList.add('active');
}

function closeDeleteModal() {
  elements.deleteModal.classList.remove('active');
  state.currentDeletingId = null;
}

async function executeDeleteStudent() {
  if (!state.currentDeletingId) return;

  try {
    elements.btnConfirmDelete.disabled = true;
    const { res, data: result } = await safeFetchJson(`${API_BASE}/api/students/${state.currentDeletingId}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error(result.error || 'Failed to delete record');

    showToast('Student record deleted from MongoDB successfully', 'success');
    closeDeleteModal();
    fetchStats();
    fetchStudents();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.btnConfirmDelete.disabled = false;
  }
}

// ============================================================================
// CSV Export Feature
// ============================================================================
function exportToCsv() {
  if (!state.students || state.students.length === 0) {
    showToast('No students available to export.', 'warning');
    return;
  }

  const headers = [
    'Student ID',
    'Full Name',
    'Email',
    'Phone',
    'Gender',
    'Department',
    'Year',
    'Semester',
    'GPA',
    'Status',
    'Date of Birth',
    'Address',
    'Created At',
  ];

  const rows = state.students.map((s) => [
    `"${s.studentId || ''}"`,
    `"${(s.fullName || '').replace(/"/g, '""')}"`,
    `"${s.email || ''}"`,
    `"${s.phone || ''}"`,
    `"${s.gender || ''}"`,
    `"${s.department || ''}"`,
    `"${s.year || ''}"`,
    `"${s.semester || ''}"`,
    s.gpa || 0,
    `"${s.status || ''}"`,
    `"${s.dob || ''}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    `"${s.createdAt || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Exported student records to CSV file', 'info');
}

// ============================================================================
// Toast Notification Utility
// ============================================================================
function showToast(message, type = 'info', duration = 3800) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info',
  };

  toast.innerHTML = `
    <div class="toast-content">
      <i class="${iconMap[type] || iconMap.info} toast-icon"></i>
      <span>${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  elements.toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 250);
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// Module Navigation Controller
// ============================================================================
function switchTab(tabId) {
  state.activeTab = tabId;
  const tabs = ['students', 'courses', 'attendance', 'reports'];

  tabs.forEach((t) => {
    const btn = document.getElementById(`tabBtn${capitalize(t)}`);
    const pane = document.getElementById(`tabPane${capitalize(t)}`);
    if (btn) btn.classList.toggle('active', t === tabId);
    if (pane) pane.style.display = t === tabId ? 'block' : 'none';
  });

  if (tabId === 'students') {
    fetchStats();
    fetchStudents();
  } else if (tabId === 'courses') {
    fetchCourses();
  } else if (tabId === 'attendance') {
    fetchCoursesForDropdown();
    fetchAttendance();
  } else if (tabId === 'reports') {
    fetchReports();
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================================
// Courses Module Controller
// ============================================================================
async function fetchCourses() {
  if (elements.loadingStateCourses) elements.loadingStateCourses.style.display = 'flex';
  if (elements.emptyStateCourses) elements.emptyStateCourses.style.display = 'none';

  try {
    const params = new URLSearchParams({
      search: state.courseFilters.search,
      department: state.courseFilters.department,
      status: state.courseFilters.status,
    });

    const { res, data: courses } = await safeFetchJson(`${API_BASE}/api/courses?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load courses');
    state.courses = Array.isArray(courses) ? courses : [];

    renderCoursesTable(state.courses);
    updateCourseStats(state.courses);
  } catch (err) {
    console.error('Fetch courses error:', err);
    showToast(err.message || 'Failed to load courses from MongoDB', 'error');
    renderCoursesTable([]);
  } finally {
    if (elements.loadingStateCourses) elements.loadingStateCourses.style.display = 'none';
  }
}

function updateCourseStats(courses) {
  if (elements.statTotalCourses) elements.statTotalCourses.textContent = courses.length;
  if (elements.statActiveCourses) {
    elements.statActiveCourses.textContent = courses.filter((c) => c.status === 'Active').length;
  }
  if (elements.statCourseDepts) {
    const depts = new Set(courses.map((c) => c.department).filter(Boolean));
    elements.statCourseDepts.textContent = depts.size;
  }
  if (elements.statTotalCredits) {
    const totalCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    elements.statTotalCredits.textContent = totalCredits;
  }
  if (elements.coursesCountText) {
    const isFiltered = state.courseFilters.search !== '' || state.courseFilters.department !== 'All' || state.courseFilters.status !== 'All';
    elements.coursesCountText.textContent = isFiltered
      ? `Showing ${courses.length} filtered academic courses`
      : `Total of ${courses.length} courses registered in curriculum`;
  }
}

function renderCoursesTable(courses) {
  if (!elements.coursesTableBody) return;
  elements.coursesTableBody.innerHTML = '';

  if (!courses || courses.length === 0) {
    if (elements.emptyStateCourses) elements.emptyStateCourses.style.display = 'flex';
    return;
  }

  if (elements.emptyStateCourses) elements.emptyStateCourses.style.display = 'none';

  courses.forEach((course) => {
    const tr = document.createElement('tr');
    tr.dataset.id = course._id;

    const statusClass = `status-${(course.status || 'active').toLowerCase()}`;

    tr.innerHTML = `
      <td>
        <span class="badge-id font-mono font-bold">${escapeHtml(course.courseCode)}</span>
      </td>
      <td>
        <div class="student-text">
          <span class="student-name">${escapeHtml(course.courseName)}</span>
          <span class="student-gender text-xs text-muted">${escapeHtml(course.description ? (course.description.length > 55 ? course.description.slice(0, 52) + '...' : course.description) : 'No description provided')}</span>
        </div>
      </td>
      <td>
        <span class="dept-name">${escapeHtml(course.department)}</span>
      </td>
      <td>
        <span class="credits-pill">
          <i class="fa-solid fa-award mr-1"></i> ${escapeHtml(course.credits || 3)} Credits
        </span>
      </td>
      <td>
        <div class="student-text">
          <span class="student-name font-normal">${escapeHtml(course.instructor || 'Unassigned')}</span>
        </div>
      </td>
      <td>
        <div class="academic-cell">
          <span class="dept-name text-xs">${escapeHtml(course.semester || 'Semester 1')}</span>
          <span class="year-sem">${escapeHtml(course.schedule || 'TBA')}</span>
        </div>
      </td>
      <td>
        <span class="capacity-pill">
          <i class="fa-solid fa-users text-xs text-muted"></i>
          <span>${escapeHtml(course.enrolledCount || 0)} / ${escapeHtml(course.capacity || 50)}</span>
        </span>
      </td>
      <td>
        <span class="status-pill ${statusClass}">
          <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> ${escapeHtml(course.status || 'Active')}
        </span>
      </td>
      <td class="text-right">
        <div class="row-actions">
          <button class="btn-action btn-edit" title="Edit Course" data-action="edit-course" data-id="${course._id}">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="btn-action btn-delete" title="Delete Course" data-action="delete-course" data-id="${course._id}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('[data-action="edit-course"]').addEventListener('click', () => openCourseModal('edit', course));
    tr.querySelector('[data-action="delete-course"]').addEventListener('click', () => openDeleteCourseModal(course));

    elements.coursesTableBody.appendChild(tr);
  });
}

function openCourseModal(mode = 'add', course = null) {
  clearCourseFormErrors();
  elements.courseForm.reset();

  if (mode === 'edit' && course) {
    state.currentEditingCourseId = course._id;
    elements.editCourseDbId.value = course._id;
    elements.courseModalTitle.textContent = 'Edit Academic Course';
    elements.courseModalSubtitle.textContent = `Updating MongoDB curriculum for ${course.courseCode}`;
    elements.courseModalHeaderIcon.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    elements.btnSubmitCourseText.textContent = 'Update Course';

    elements.formCourseCode.value = course.courseCode || '';
    elements.formCourseName.value = course.courseName || '';
    elements.formCourseDept.value = course.department || '';
    elements.formCourseCredits.value = course.credits || 3;
    elements.formCourseInstructor.value = course.instructor || '';
    elements.formCourseSemester.value = course.semester || 'Semester 1';
    elements.formCourseSchedule.value = course.schedule || '';
    elements.formCourseCapacity.value = course.capacity || 50;
    elements.formCourseStatus.value = course.status || 'Active';
    elements.formCourseDesc.value = course.description || '';
  } else {
    state.currentEditingCourseId = null;
    elements.editCourseDbId.value = '';
    elements.courseModalTitle.textContent = 'Add New Course';
    elements.courseModalSubtitle.textContent = 'Fill in curriculum details to store in MongoDB';
    elements.courseModalHeaderIcon.innerHTML = '<i class="fa-solid fa-book-medical"></i>';
    elements.btnSubmitCourseText.textContent = 'Save Course';
  }

  elements.courseModal.classList.add('active');
  elements.formCourseCode.focus();
}

function closeCourseModal() {
  elements.courseModal.classList.remove('active');
  state.currentEditingCourseId = null;
  clearCourseFormErrors();
}

function clearCourseFormErrors() {
  if (elements.errCourseCode) elements.errCourseCode.textContent = '';
  if (elements.errCourseName) elements.errCourseName.textContent = '';
  if (elements.errCourseDept) elements.errCourseDept.textContent = '';
  if (elements.errCourseCredits) elements.errCourseCredits.textContent = '';
}

async function handleCourseSubmit(e) {
  e.preventDefault();
  clearCourseFormErrors();

  const code = elements.formCourseCode.value.trim().toUpperCase();
  const name = elements.formCourseName.value.trim();
  const dept = elements.formCourseDept.value;
  const credits = Number(elements.formCourseCredits.value);

  let hasError = false;
  if (!code) {
    elements.errCourseCode.textContent = 'Course code is required (e.g. CS101)';
    hasError = true;
  }
  if (!name) {
    elements.errCourseName.textContent = 'Course title is required';
    hasError = true;
  }
  if (!dept) {
    elements.errCourseDept.textContent = 'Please select a department';
    hasError = true;
  }
  if (!credits || credits < 1) {
    elements.errCourseCredits.textContent = 'Credits must be at least 1';
    hasError = true;
  }
  if (hasError) return;

  const payload = {
    courseCode: code,
    courseName: name,
    department: dept,
    credits: credits,
    instructor: elements.formCourseInstructor.value.trim(),
    semester: elements.formCourseSemester.value,
    schedule: elements.formCourseSchedule.value.trim(),
    capacity: Number(elements.formCourseCapacity.value) || 50,
    status: elements.formCourseStatus.value,
    description: elements.formCourseDesc.value.trim(),
  };

  try {
    elements.btnSubmitCourse.disabled = true;
    elements.btnSubmitCourseText.textContent = 'Saving...';

    const isEdit = Boolean(state.currentEditingCourseId);
    const url = isEdit
      ? `${API_BASE}/api/courses/${state.currentEditingCourseId}`
      : `${API_BASE}/api/courses`;
    const method = isEdit ? 'PUT' : 'POST';

    const { res, data: result } = await safeFetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(result.error || 'Failed to save course');

    showToast(isEdit ? 'Course updated successfully' : 'New course added successfully', 'success');
    closeCourseModal();
    fetchCourses();
    fetchCoursesForDropdown();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.btnSubmitCourse.disabled = false;
    elements.btnSubmitCourseText.textContent = state.currentEditingCourseId ? 'Update Course' : 'Save Course';
  }
}

function openDeleteCourseModal(course) {
  state.currentDeletingCourseId = course._id;
  elements.deleteCourseName.textContent = course.courseName;
  elements.deleteCourseCode.textContent = course.courseCode;
  elements.deleteCourseDbId.value = course._id;
  elements.deleteCourseModal.classList.add('active');
}

function closeDeleteCourseModal() {
  elements.deleteCourseModal.classList.remove('active');
  state.currentDeletingCourseId = null;
}

async function executeDeleteCourse() {
  if (!state.currentDeletingCourseId) return;

  try {
    elements.btnConfirmDeleteCourse.disabled = true;
    const { res, data: result } = await safeFetchJson(`${API_BASE}/api/courses/${state.currentDeletingCourseId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(result.error || 'Failed to delete course');

    showToast('Course removed from MongoDB successfully', 'success');
    closeDeleteCourseModal();
    fetchCourses();
    fetchCoursesForDropdown();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.btnConfirmDeleteCourse.disabled = false;
  }
}

async function fetchCoursesForDropdown() {
  try {
    const { res, data: courses } = await safeFetchJson(`${API_BASE}/api/courses`);
    if (!res.ok) return;

    if (elements.attendanceCourseSelect) {
      const currentVal = elements.attendanceCourseSelect.value;
      elements.attendanceCourseSelect.innerHTML = '<option value="All">All Courses</option>';
      courses.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.courseCode;
        opt.textContent = `${c.courseCode} - ${c.courseName}`;
        elements.attendanceCourseSelect.appendChild(opt);
      });
      if (currentVal) elements.attendanceCourseSelect.value = currentVal;
    }

    if (elements.batchCourseSelect) {
      elements.batchCourseSelect.innerHTML = '';
      courses.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.courseCode;
        opt.textContent = `${c.courseCode} - ${c.courseName} (${c.department})`;
        opt.dataset.name = c.courseName;
        elements.batchCourseSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error fetching courses for dropdown:', err);
  }
}

// ============================================================================
// Attendance Module Controller
// ============================================================================
async function fetchAttendance() {
  if (elements.loadingStateAttendance) elements.loadingStateAttendance.style.display = 'flex';
  if (elements.emptyStateAttendance) elements.emptyStateAttendance.style.display = 'none';

  try {
    const params = new URLSearchParams({
      date: state.attendanceFilters.date || '',
      courseCode: state.attendanceFilters.courseCode || 'All',
      status: state.attendanceFilters.status || 'All',
    });

    const [resRecords, resStats] = await Promise.all([
      safeFetchJson(`${API_BASE}/api/attendance?${params.toString()}`),
      safeFetchJson(`${API_BASE}/api/attendance/stats`),
    ]);

    if (!resRecords.res.ok) throw new Error('Failed to load attendance logs');
    const records = Array.isArray(resRecords.data) ? resRecords.data : [];
    state.attendance = records;

    renderAttendanceTable(records);

    if (resStats.res.ok) {
      updateAttendanceStats(resStats.data, records.length);
    }
  } catch (err) {
    console.error('Attendance fetch error:', err);
    showToast(err.message || 'Failed to load attendance from MongoDB', 'error');
    renderAttendanceTable([]);
  } finally {
    if (elements.loadingStateAttendance) elements.loadingStateAttendance.style.display = 'none';
  }
}

function updateAttendanceStats(stats, filteredCount) {
  if (elements.statAttendanceRate) elements.statAttendanceRate.textContent = `${stats.attendanceRate || 0}%`;
  if (elements.statAttendancePresent) elements.statAttendancePresent.textContent = stats.present || 0;
  if (elements.statAttendanceLateExcused) elements.statAttendanceLateExcused.textContent = (stats.late || 0) + (stats.excused || 0);
  if (elements.statAttendanceAbsent) elements.statAttendanceAbsent.textContent = stats.absent || 0;

  if (elements.attendanceCountText) {
    const isFiltered = Boolean(state.attendanceFilters.date || state.attendanceFilters.courseCode !== 'All' || state.attendanceFilters.status !== 'All');
    elements.attendanceCountText.textContent = isFiltered
      ? `Showing ${filteredCount} attendance records for selected criteria`
      : `Total of ${filteredCount} attendance records logged`;
  }
}

function updateResetAttendanceFilterVisibility() {
  if (!elements.btnResetAttendanceFilter) return;
  const isFiltered = Boolean(state.attendanceFilters.date || state.attendanceFilters.courseCode !== 'All' || state.attendanceFilters.status !== 'All');
  elements.btnResetAttendanceFilter.style.display = isFiltered ? 'inline-flex' : 'none';
}

function renderAttendanceTable(records) {
  if (!elements.attendanceTableBody) return;
  elements.attendanceTableBody.innerHTML = '';

  if (!records || records.length === 0) {
    if (elements.emptyStateAttendance) elements.emptyStateAttendance.style.display = 'flex';
    return;
  }

  if (elements.emptyStateAttendance) elements.emptyStateAttendance.style.display = 'none';

  records.forEach((att) => {
    const tr = document.createElement('tr');
    tr.dataset.id = att._id;

    const initials = att.studentName
      ? att.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')
      : 'ST';

    const avatarHtml = att.studentAvatar
      ? `<img src="${escapeHtml(att.studentAvatar)}" alt="${escapeHtml(att.studentName)}" class="avatar-img" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';" />`
      : escapeHtml(initials);

    tr.innerHTML = `
      <td>
        <div class="student-info-cell">
          <div class="avatar">${avatarHtml}</div>
          <div class="student-text">
            <span class="student-name">${escapeHtml(att.studentName)}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="badge-id">${escapeHtml(att.studentId)}</span>
      </td>
      <td>
        <span class="dept-name text-xs">${escapeHtml(att.department || 'General')}</span>
      </td>
      <td>
        <div class="academic-cell">
          <span class="dept-name">${escapeHtml(att.courseCode)}</span>
          <span class="year-sem">${escapeHtml(att.courseName || '')}</span>
        </div>
      </td>
      <td>
        <span class="font-mono text-xs">${escapeHtml(att.date)}</span>
      </td>
      <td>
        <div class="att-toggle-group">
          <button type="button" class="att-toggle-btn btn-present ${att.status === 'Present' ? 'active' : ''}" data-status="Present" title="Mark Present">P</button>
          <button type="button" class="att-toggle-btn btn-late ${att.status === 'Late' ? 'active' : ''}" data-status="Late" title="Mark Late">L</button>
          <button type="button" class="att-toggle-btn btn-excused ${att.status === 'Excused' ? 'active' : ''}" data-status="Excused" title="Mark Excused">E</button>
          <button type="button" class="att-toggle-btn btn-absent ${att.status === 'Absent' ? 'active' : ''}" data-status="Absent" title="Mark Absent">A</button>
        </div>
      </td>
      <td>
        <span class="text-xs text-muted">${escapeHtml(att.remarks || '-')}</span>
      </td>
      <td class="text-right">
        <div class="row-actions">
          <button class="btn-action btn-delete" title="Delete Attendance Record" data-action="delete-attendance" data-id="${att._id}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    // Row status toggles
    tr.querySelectorAll('.att-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => quickToggleAttendance(att._id, btn.dataset.status));
    });

    tr.querySelector('[data-action="delete-attendance"]').addEventListener('click', () => deleteAttendance(att._id));

    elements.attendanceTableBody.appendChild(tr);
  });
}

async function quickToggleAttendance(attendanceId, newStatus) {
  try {
    const { res, data: result } = await safeFetchJson(`${API_BASE}/api/attendance/${attendanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error(result.error || 'Failed to update attendance');

    showToast(`Status updated to ${newStatus}`, 'success', 2000);
    fetchAttendance();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteAttendance(attendanceId) {
  if (!confirm('Are you sure you want to delete this attendance log?')) return;

  try {
    const { res, data: result } = await safeFetchJson(`${API_BASE}/api/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(result.error || 'Failed to delete attendance log');

    showToast('Attendance log deleted', 'success');
    fetchAttendance();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function openMarkAttendanceModal() {
  await fetchCoursesForDropdown();

  // Set default date to today
  const today = new Date().toISOString().slice(0, 10);
  if (elements.batchDateInput) elements.batchDateInput.value = today;

  // Make sure students are loaded
  if (!state.students || state.students.length === 0) {
    await fetchStudents();
  }

  renderBatchStudentsRoster(state.students);
  elements.attendanceModal.classList.add('active');
}

function closeMarkAttendanceModal() {
  elements.attendanceModal.classList.remove('active');
}

function renderBatchStudentsRoster(students) {
  if (!elements.batchStudentsRoster) return;
  elements.batchStudentsRoster.innerHTML = '';

  const activeStudents = (students || []).filter((s) => s.status !== 'Inactive' && s.status !== 'Suspended');
  if (elements.batchRosterCount) elements.batchRosterCount.textContent = activeStudents.length;

  if (activeStudents.length === 0) {
    elements.batchStudentsRoster.innerHTML = `
      <div class="empty-state p-4">
        <p>No active students available. Add students first.</p>
      </div>
    `;
    return;
  }

  activeStudents.forEach((student) => {
    const row = document.createElement('div');
    row.className = 'batch-student-row';
    row.dataset.studentId = student.studentId;
    row.dataset.studentDbId = student._id;

    const initials = student.fullName
      ? student.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
      : 'ST';

    const avatarHtml = student.avatar
      ? `<img src="${escapeHtml(student.avatar)}" alt="${escapeHtml(student.fullName)}" class="avatar-img" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';" />`
      : escapeHtml(initials);

    row.innerHTML = `
      <div class="batch-student-info">
        <div class="avatar">${avatarHtml}</div>
        <div class="batch-student-text">
          <strong>${escapeHtml(student.fullName)}</strong>
          <span>${escapeHtml(student.studentId)} &bull; ${escapeHtml(student.department)}</span>
        </div>
      </div>

      <div class="att-toggle-group">
        <button type="button" class="att-toggle-btn btn-present active" data-status="Present">Present</button>
        <button type="button" class="att-toggle-btn btn-absent" data-status="Absent">Absent</button>
        <button type="button" class="att-toggle-btn btn-late" data-status="Late">Late</button>
        <button type="button" class="att-toggle-btn btn-excused" data-status="Excused">Excused</button>
      </div>

      <input type="text" class="batch-remarks-input" placeholder="Remarks (opt)" />
    `;

    // Button toggle inside row
    const buttons = row.querySelectorAll('.att-toggle-btn');
    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        buttons.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
      });
    });

    elements.batchStudentsRoster.appendChild(row);
  });
}

function markAllBatchPresent() {
  if (!elements.batchStudentsRoster) return;
  const rows = elements.batchStudentsRoster.querySelectorAll('.batch-student-row');
  rows.forEach((row) => {
    const buttons = row.querySelectorAll('.att-toggle-btn');
    buttons.forEach((b) => {
      b.classList.toggle('active', b.dataset.status === 'Present');
    });
  });
  showToast('All students marked as Present in form', 'info', 2000);
}

async function handleAttendanceBatchSubmit(e) {
  e.preventDefault();

  const courseCode = elements.batchCourseSelect.value;
  const date = elements.batchDateInput.value;

  if (!courseCode) {
    showToast('Please select a course for attendance roll call', 'warning');
    return;
  }
  if (!date) {
    showToast('Please specify the attendance date', 'warning');
    return;
  }

  const selectedOpt = elements.batchCourseSelect.options[elements.batchCourseSelect.selectedIndex];
  const courseName = selectedOpt ? selectedOpt.dataset.name || selectedOpt.textContent : '';

  const rows = elements.batchStudentsRoster.querySelectorAll('.batch-student-row');
  if (rows.length === 0) {
    showToast('No students to record attendance for', 'warning');
    return;
  }

  const records = [];
  rows.forEach((row) => {
    const studentId = row.dataset.studentId;
    const activeBtn = row.querySelector('.att-toggle-btn.active');
    const status = activeBtn ? activeBtn.dataset.status : 'Present';
    const remarks = row.querySelector('.batch-remarks-input').value.trim();

    records.push({
      studentId,
      status,
      remarks,
    });
  });

  try {
    elements.btnSaveAttendanceBatch.disabled = true;
    elements.btnSaveAttendanceBatchText.textContent = 'Saving Records...';

    const { res, data: result } = await safeFetchJson(`${API_BASE}/api/attendance/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode,
        courseName,
        date,
        records,
      }),
    });

    if (!res.ok) throw new Error(result.error || 'Failed to save attendance batch');

    showToast(`Saved attendance for ${result.savedCount} students!`, 'success');
    closeMarkAttendanceModal();
    fetchAttendance();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    elements.btnSaveAttendanceBatch.disabled = false;
    elements.btnSaveAttendanceBatchText.textContent = 'Save Attendance Records';
  }
}

function exportAttendanceToCsv() {
  if (!state.attendance || state.attendance.length === 0) {
    showToast('No attendance records available to export', 'warning');
    return;
  }

  const headers = ['Student ID', 'Student Name', 'Department', 'Course Code', 'Course Name', 'Date', 'Status', 'Remarks'];
  const rows = state.attendance.map((a) => [
    `"${a.studentId || ''}"`,
    `"${(a.studentName || '').replace(/"/g, '""')}"`,
    `"${a.department || ''}"`,
    `"${a.courseCode || ''}"`,
    `"${(a.courseName || '').replace(/"/g, '""')}"`,
    `"${a.date || ''}"`,
    `"${a.status || ''}"`,
    `"${(a.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Exported attendance records to CSV', 'info');
}

// ============================================================================
// Reports & Analytics Module Controller
// ============================================================================
async function fetchReports(isManual = false) {
  try {
    const { res, data } = await safeFetchJson(`${API_BASE}/api/reports/summary`);
    if (!res.ok) throw new Error('Failed to load academic reports');
    state.reportsData = data;

    renderReports(data);
    if (isManual) showToast('Academic intelligence telemetry updated live', 'success');
  } catch (err) {
    console.error('Reports fetch error:', err);
    showToast(err.message || 'Failed to generate institutional reports', 'error');
  }
}

function renderReports(data) {
  if (!data) return;

  const { metrics, gpaTiers, attendanceBreakdown, departments, topPerformers, atRiskStudents } = data;

  // 1. KPI Counters
  if (elements.reportAvgGpa) elements.reportAvgGpa.textContent = metrics.avgGpa || '0.00';
  if (elements.reportDeansList) elements.reportDeansList.textContent = gpaTiers.deansList || 0;
  if (elements.reportAttendanceRate) elements.reportAttendanceRate.textContent = `${metrics.attendanceRate || 0}%`;
  if (elements.reportAtRiskCount) elements.reportAtRiskCount.textContent = (gpaTiers.atRiskGpa || 0) + (atRiskStudents ? atRiskStudents.length : 0);

  // 2. GPA Distribution Bars
  if (elements.gpaDistributionBars) {
    const total = metrics.totalStudents || 1;
    const deansPct = Math.round(((gpaTiers.deansList || 0) / total) * 100);
    const goodPct = Math.round(((gpaTiers.goodStanding || 0) / total) * 100);
    const avgPct = Math.round(((gpaTiers.averageStanding || 0) / total) * 100);
    const riskPct = Math.round(((gpaTiers.atRiskGpa || 0) / total) * 100);

    elements.gpaDistributionBars.innerHTML = `
      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-award text-green"></i> Dean's List (GPA ≥ 3.80)
          </span>
          <span class="progress-stat-val">${gpaTiers.deansList || 0} students (${deansPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-emerald" style="width: ${deansPct}%;"></div>
        </div>
      </div>

      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-circle-check text-blue"></i> Good Academic Standing (3.00 - 3.79)
          </span>
          <span class="progress-stat-val">${gpaTiers.goodStanding || 0} students (${goodPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-sky" style="width: ${goodPct}%;"></div>
        </div>
      </div>

      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-circle-dot text-amber"></i> Average Standing (2.00 - 2.99)
          </span>
          <span class="progress-stat-val">${gpaTiers.averageStanding || 0} students (${avgPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-amber" style="width: ${avgPct}%;"></div>
        </div>
      </div>

      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-triangle-exclamation text-danger"></i> Academic Warning Tier (&lt; 2.00)
          </span>
          <span class="progress-stat-val">${gpaTiers.atRiskGpa || 0} students (${riskPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-rose" style="width: ${riskPct}%;"></div>
        </div>
      </div>
    `;
  }

  // 3. Attendance Compliance Bars
  if (elements.attendanceComplianceBars) {
    const attTotal = attendanceBreakdown.total || 1;
    const pPct = Math.round(((attendanceBreakdown.present || 0) / attTotal) * 100);
    const lPct = Math.round(((attendanceBreakdown.late || 0) / attTotal) * 100);
    const ePct = Math.round(((attendanceBreakdown.excused || 0) / attTotal) * 100);
    const aPct = Math.round(((attendanceBreakdown.absent || 0) / attTotal) * 100);

    elements.attendanceComplianceBars.innerHTML = `
      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-user-check text-green"></i> Present
          </span>
          <span class="progress-stat-val">${attendanceBreakdown.present || 0} sessions (${pPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-emerald" style="width: ${pPct}%;"></div>
        </div>
      </div>

      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-clock text-amber"></i> Late Arrival
          </span>
          <span class="progress-stat-val">${attendanceBreakdown.late || 0} sessions (${lPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-amber" style="width: ${lPct}%;"></div>
        </div>
      </div>

      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-envelope-open-text text-blue"></i> Excused Absence
          </span>
          <span class="progress-stat-val">${attendanceBreakdown.excused || 0} sessions (${ePct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-sky" style="width: ${ePct}%;"></div>
        </div>
      </div>

      <div class="progress-stat-row">
        <div class="progress-stat-meta">
          <span class="progress-stat-label">
            <i class="fa-solid fa-user-xmark text-danger"></i> Unexcused Absent
          </span>
          <span class="progress-stat-val">${attendanceBreakdown.absent || 0} sessions (${aPct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill bg-rose" style="width: ${aPct}%;"></div>
        </div>
      </div>
    `;
  }

  // 4. Department Breakdown Table
  if (elements.departmentReportTableBody) {
    elements.departmentReportTableBody.innerHTML = '';
    (departments || []).forEach((dept) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="text-primary">${escapeHtml(dept.department)}</strong></td>
        <td>${escapeHtml(dept.studentCount)} students</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${escapeHtml(dept.sharePercentage)}%</span>
            <div class="progress-track" style="width: 80px; display: inline-flex;">
              <div class="progress-fill bg-sky" style="width: ${dept.sharePercentage}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <span class="gpa-pill gpa-high">
            <i class="fa-solid fa-star text-xs"></i> ${escapeHtml(dept.avgGpa)}
          </span>
        </td>
        <td>
          <span class="status-pill status-active">${escapeHtml(dept.activeCount)} Active</span>
        </td>
      `;
      elements.departmentReportTableBody.appendChild(tr);
    });
  }

  // 5. Honor Roll / Top Performers Table
  if (elements.honorRollTableBody) {
    elements.honorRollTableBody.innerHTML = '';
    (topPerformers || []).slice(0, 5).forEach((stu, idx) => {
      const tr = document.createElement('tr');
      const rankBadgeClass = idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : 'rank-other';
      const rankNum = idx + 1;

      const initials = stu.fullName
        ? stu.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
        : 'ST';

      const avatarHtml = stu.avatar
        ? `<img src="${escapeHtml(stu.avatar)}" alt="${escapeHtml(stu.fullName)}" class="avatar-img" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHtml(initials)}';" />`
        : escapeHtml(initials);

      tr.innerHTML = `
        <td>
          <span class="rank-badge ${rankBadgeClass}">${rankNum}</span>
        </td>
        <td>
          <div class="student-info-cell">
            <div class="avatar">${avatarHtml}</div>
            <div class="student-text">
              <span class="student-name">${escapeHtml(stu.fullName)}</span>
              <span class="student-gender text-xs font-mono">${escapeHtml(stu.studentId)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="dept-name text-xs">${escapeHtml(stu.department)}</span>
        </td>
        <td>
          <span class="gpa-pill gpa-high font-bold">
            <i class="fa-solid fa-star text-xs"></i> ${Number(stu.gpa).toFixed(2)}
          </span>
        </td>
      `;
      elements.honorRollTableBody.appendChild(tr);
    });
  }

  // 6. Academic Interventions / At-Risk List
  if (elements.atRiskStudentsContainer) {
    elements.atRiskStudentsContainer.innerHTML = '';
    const atRiskList = atRiskStudents || [];

    if (atRiskList.length === 0) {
      elements.atRiskStudentsContainer.innerHTML = `
        <div class="all-clear-badge">
          <i class="fa-solid fa-circle-check"></i>
          <h4>All Students in Good Academic Standing</h4>
          <p>No students currently meet the academic risk threshold (GPA &lt; 2.0 or Attendance &lt; 75%).</p>
        </div>
      `;
    } else {
      const listDiv = document.createElement('div');
      listDiv.className = 'at-risk-list';

      atRiskList.forEach((stu) => {
        const item = document.createElement('div');
        item.className = 'at-risk-card';
        item.innerHTML = `
          <div class="at-risk-info">
            <i class="fa-solid fa-triangle-exclamation text-danger"></i>
            <div class="student-text">
              <strong>${escapeHtml(stu.fullName)} (${escapeHtml(stu.studentId)})</strong>
              <span class="text-xs text-secondary">${escapeHtml(stu.department)} &bull; GPA: ${escapeHtml(stu.gpa)}</span>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="window.location.href='mailto:${escapeHtml(stu.email)}'">
            <i class="fa-solid fa-envelope"></i> Contact
          </button>
        `;
        listDiv.appendChild(item);
      });

      elements.atRiskStudentsContainer.appendChild(listDiv);
    }
  }
}

function exportReportsToCsv() {
  if (!state.reportsData) {
    showToast('No report data available to export', 'warning');
    return;
  }

  const { metrics, departments, topPerformers } = state.reportsData;

  const content = [
    'EDUPULSE ACADEMIC & INSTITUTIONAL REPORT SUMMARY',
    `Generated On: ${new Date().toLocaleString()}`,
    '',
    'EXECUTIVE METRICS',
    `Total Students,${metrics.totalStudents}`,
    `Active Students,${metrics.activeStudents}`,
    `Average GPA,${metrics.avgGpa}`,
    `Attendance Compliance Rate,${metrics.attendanceRate}%`,
    `Total Courses Offered,${metrics.totalCourses}`,
    '',
    'DEPARTMENT PERFORMANCE BREAKDOWN',
    'Department,Student Count,Campus Share %,Average GPA,Active Students',
    ...(departments || []).map((d) => `"${d.department}",${d.studentCount},${d.sharePercentage}%,${d.avgGpa},${d.activeCount}`),
    '',
    'HONOR ROLL - TOP PERFORMERS',
    'Rank,Student ID,Full Name,Department,GPA',
    ...(topPerformers || []).map((s, idx) => `${idx + 1},"${s.studentId}","${s.fullName}","${s.department}",${s.gpa}`),
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `academic_report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Academic report exported to CSV', 'info');
}
