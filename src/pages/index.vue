<template>
  <div class="payroll-page">
    <div>Тестовые данные</div>
    <div>{{ testItems }}</div>
    <div class="payroll-card">
      <!-- Шапка карточки -->
      <header class="payroll-card__header">
        <div class="payroll-card__title-wrap">
          <h1 class="payroll-card__title">Табель по сотрудникам</h1>
          <span v-if="payroll?.month" class="payroll-card__badge">
            {{ payroll.month }}
          </span>
        </div>

        <div style="display: flex; gap: 8px; align-items: center">
          <button
            type="button"
            class="payroll-card__action"
            :disabled="loading"
            @click="loadPayroll"
          >
            <span class="payroll-card__action-icon">⟳</span>
            <span>Обновить</span>
          </button>
        </div>
      </header>

      <!-- Фильтры -->
      <div class="payroll-filters" aria-label="Фильтры">
        <div class="filters-row">
          <label class="filter-item">
            <div class="filter-label">Месяц</div>
            <input
              type="month"
              v-model="filters.month"
              :disabled="loading"
              required
            />
          </label>

          <label class="filter-item">
            <div class="filter-label">Задача (ID)</div>
            <input
              type="text"
              v-model="filters.task_id"
              :disabled="loading"
              placeholder="task_id"
            />
          </label>
        </div>

        <div class="filters-row">
          <label class="filter-item filter-item--wide">
            <div class="filter-label">Поиск</div>
            <input
              type="search"
              v-model="filters.search"
              :disabled="loading"
              placeholder="по комментарию, названию задачи, проекту или ФИО"
            />
          </label>

          <label class="filter-item">
            <div class="filter-label">Дата от</div>
            <input
              type="date"
              v-model="filters.date_from"
              :disabled="loading"
            />
          </label>

          <label class="filter-item">
            <div class="filter-label">Дата до</div>
            <input type="date" v-model="filters.date_to" :disabled="loading" />
          </label>

          <label class="filter-item">
            <div class="filter-label">Строк на странице</div>
            <input
              type="number"
              v-model.number="pageSize"
              :disabled="loading"
              min="1"
              max="20"
              step="1"
            />
          </label>

          <div class="filters-actions">
            <button
              class="payroll-card__action"
              :disabled="loading"
              @click="applyFilters"
            >
              Применить
            </button>

            <button
              class="payroll-card__action"
              :disabled="loading"
              @click="clearFilters"
              type="button"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>

      <!-- Состояния -->
      <div v-if="loading" class="payroll-state">
        <div class="payroll-skeleton-row" />
        <div class="payroll-skeleton-row" />
        <div class="payroll-skeleton-row" />
      </div>

      <div v-else-if="error" class="payroll-state payroll-state--error">
        {{ error }}
      </div>

      <!-- Таблица -->
      <div v-else-if="payroll && hasRows" class="payroll-table-wrap">
        <table class="payroll-table">
          <thead>
            <tr>
              <th class="col-employee">Сотрудник</th>
              <th class="col-date">Дата</th>
              <th class="col-project">Проект</th>
              <th class="col-task">Задача</th>
              <th class="col-hours">Часы</th>
              <th class="col-rate">Ставка, ₽/ч</th>
              <th class="col-amount">Сумма, ₽</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in payroll.rows" :key="row.task_id + row.date">
              <td class="col-employee">
                <div class="cell-main">
                  <button
                    type="button"
                    class="cell-main__primary cell-main__primary--link"
                    @click="selectEmployeeFromRow(row)"
                    :disabled="loading"
                    title="Фильтровать по этому сотруднику"
                  >
                    {{ row.employee }}
                  </button>
                  <div class="cell-main__secondary">
                    ID: {{ row.employee_id }}
                  </div>
                </div>
              </td>

              <td class="col-date">
                {{ formatDate(row.date) }}
              </td>

              <td class="col-project">
                <span v-if="row.project" class="chip chip--project">
                  {{ row.project }}
                </span>
                <span v-else class="cell-muted">Без проекта</span>
              </td>

              <td class="col-task">
                <a
                  class="task-link"
                  :href="row.task_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="task-link__text">
                    {{ row.task }}
                  </span>
                  <span class="task-link__icon">↗</span>
                </a>
                <div class="cell-main__secondary">
                  ID задачи: {{ row.task_id }}
                </div>
              </td>

              <td class="col-hours col-numeric">
                {{ formatNumber(row.hours) }}
              </td>

              <td class="col-rate col-numeric">
                {{ formatNumber(row.hourly_rate) }}
              </td>

              <td class="col-amount col-numeric col-amount--accent">
                {{ formatNumber(row.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else-if="payroll && !hasRows"
        class="payroll-state payroll-state__alert"
      >
        Список пустой...
      </div>

      <div v-if="payroll && hasRows && !showAll" class="payroll-pagination">
        <button
          type="button"
          class="payroll-card__action"
          :disabled="loading || !canPrev"
          @click="prevPage"
        >
          ← Назад
        </button>

        <div class="payroll-pagination__meta">
          <span
            >Страница: <b>{{ page }}</b></span
          >
          <span class="payroll-pagination__dot">•</span>
          <span
            >Показано: <b>{{ payroll.rows?.length ?? 0 }}</b> /
            {{ pageSize }}</span
          >
        </div>

        <button
          type="button"
          class="payroll-card__action"
          :disabled="loading || !canNext"
          @click="nextPage"
        >
          Вперёд →
        </button>
      </div>

      <div class="btn-payroll-card__wrapper">
        <button
          v-if="payroll && hasRows"
          type="button"
          class="payroll-card__action payroll-card__btn"
          :disabled="loading"
          @click="toggleShowAll"
        >
          {{
            showAll
              ? "Включить пагинацию"
              : "Показать весь список (выключить пагинацию)"
          }}
        </button>
      </div>

      <!-- Итоги -->
      <footer v-if="payroll" class="payroll-footer">
        <div class="payroll-summary">
          <div class="payroll-summary__block">
            <div class="payroll-summary__title">Итого по сотрудникам</div>
            <ul class="payroll-summary__list">
              <li
                v-for="(sum, name) in payroll.total_by_employee"
                :key="name"
                class="payroll-summary__item"
              >
                <span class="payroll-summary__name">{{ name }}</span>
                <span class="payroll-summary__sum">
                  {{ formatNumber(sum) }} ₽
                </span>
              </li>
            </ul>
          </div>

          <div class="payroll-summary__block payroll-summary__block--total">
            <div class="payroll-summary__title">Общий итог</div>
            <div class="payroll-summary__grand">
              <span>Начислено за месяц:</span>
              <strong>{{ formatNumber(payroll.grand_total) }} ₽</strong>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";

const TEST_PAYROLL_DATA = [
  {
    employee: "Иван Петров",
    employee_id: 101,
    date: "2026-01-05 10:00",
    project: "Risoma Widgets",
    project_id: 501,
    task: "Верстка таблицы",
    task_id: 9001,
    task_url: "https://example.com/task/9001",
    hours: 3.5,
    hourly_rate: 700,
    amount: 2450,
    comment: "таблица + sticky head",
  },
  {
    employee: "Иван Петров",
    employee_id: 101,
    date: "2026-01-07 12:00",
    project: "Risoma Widgets",
    project_id: 501,
    task: "Фильтры и поиск",
    task_id: 9002,
    task_url: "https://example.com/task/9002",
    hours: 6,
    hourly_rate: 700,
    amount: 4200,
    comment: "search, date range",
  },
  {
    employee: "Анна Сидорова",
    employee_id: 102,
    date: "2026-01-08 09:30",
    project: "RepairBT",
    project_id: 502,
    task: "Правки UI/UX",
    task_id: 9100,
    task_url: "https://example.com/task/9100",
    hours: 4,
    hourly_rate: 900,
    amount: 3600,
    comment: "chips, hover",
  },
  {
    employee: "Анна Сидорова",
    employee_id: 102,
    date: "2026-01-10 14:15",
    project: "",
    project_id: "",
    task: "Коммуникация",
    task_id: 9101,
    task_url: "https://example.com/task/9101",
    hours: 1.5,
    hourly_rate: 900,
    amount: 1350,
    comment: "созвон",
  },
  {
    employee: "Сергей Иванов",
    employee_id: 103,
    date: "2026-01-12 18:00",
    project: "Marketing",
    project_id: 503,
    task: "Отчетность",
    task_id: 9200,
    task_url: "https://example.com/task/9200",
    hours: 2,
    hourly_rate: 650,
    amount: 1300,
    comment: "итоги месяца",
  },

  {
    employee: "Иван Петров1",
    employee_id: 1011,
    date: "2026-02-05 10:00",
    project: "Risoma Widgets",
    project_id: 501,
    task: "Верстка таблицы",
    task_id: 9001,
    task_url: "https://example.com/task/9001",
    hours: 3.5,
    hourly_rate: 700,
    amount: 2450,
    comment: "таблица + sticky head",
  },
  {
    employee: "Иван Петров1",
    employee_id: 1011,
    date: "2026-02-07 12:00",
    project: "Risoma Widgets",
    project_id: 501,
    task: "Фильтры и поиск",
    task_id: 9002,
    task_url: "https://example.com/task/9002",
    hours: 6,
    hourly_rate: 700,
    amount: 4200,
    comment: "search, date range",
  },
  {
    employee: "Анна Сидорова1",
    employee_id: 1021,
    date: "2026-02-08 09:30",
    project: "RepairBT",
    project_id: 502,
    task: "Правки UI/UX",
    task_id: 9100,
    task_url: "https://example.com/task/9100",
    hours: 4,
    hourly_rate: 900,
    amount: 3600,
    comment: "chips, hover",
  },
  {
    employee: "Анна Сидорова1",
    employee_id: 1021,
    date: "2026-02-10 14:15",
    project: "",
    project_id: "",
    task: "Коммуникация",
    task_id: 9101,
    task_url: "https://example.com/task/9101",
    hours: 1.5,
    hourly_rate: 900,
    amount: 1350,
    comment: "созвон",
  },
  {
    employee: "Сергей Иванов1",
    employee_id: 1031,
    date: "2026-02-12 18:00",
    project: "Marketing",
    project_id: 503,
    task: "Отчетность",
    task_id: 9200,
    task_url: "https://example.com/task/9200",
    hours: 2,
    hourly_rate: 650,
    amount: 1300,
    comment: "итоги месяца",
  },
];

const payroll = ref(null);
const loading = ref(false);
const error = ref(null);

const pageSize = ref(20);
const page = ref(1);
const showAll = ref(false);

const testItems = ref([])

/**
 * Универсальный GET (fetch) с таймаутом и нормальной ошибкой
 */
const getJson = async (url, { timeout = 10000, headers = {} } = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcwMTgzNTE4LCJpYXQiOjE3NzAxODAyMTgsImp0aSI6ImI1MzNmYTg4MWE0YTQxZDlhYzg1NjdlZDYyOWY5ODI4IiwidXNlcl9pZCI6IjEifQ.azpyLjVXFFIXSfwMUeRRruLD7w4_ezSZtz__lK3Kfwo',
        ...headers,
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      // пробуем достать текст ошибки с бэка (часто там json/текст)
      let details = ''
      try {
        details = await res.text()
      } catch (_) {}

      throw new Error(`GET ${url} → ${res.status} ${res.statusText}${details ? `: ${details}` : ''}`)
    }

    return await res.json()
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error(`GET ${url} → timeout ${timeout}ms`)
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Загружаем тестовые items с API и кладём в testItems
 * Пример: API Root отдаёт { notes: "http://.../api/notes/" }
 */
const loadTestItems = async () => {
  try {
    const root = await getJson('https://lalalatututu.store/api/')
    const notesUrl = root.notes.replace('http://', 'https://')
    const notes = await getJson(notesUrl)

    testItems.value = notes
  } catch (e) {
    console.error(e)
    testItems.value = []
  }
}



onMounted(() => {
  loadPayroll()
  loadTestItems()
})

const hasRows = computed(() => (payroll.value?.rows?.length ?? 0) > 0);

const getCurrentMonth = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
};

// Фильтры
const filters = ref({
  month: getCurrentMonth(), // YYYY-MM
  employee_id: "",
  project_id: "",
  task_id: "",
  search: "",
  date_from: "",
  date_to: "",
});

const clampPageSize = (v) => {
  let n = Number(v) || 20;
  if (n < 1) n = 1;
  if (n > 20) n = 20;
  return n;
};

const offsetComputed = computed(
  () => (page.value - 1) * clampPageSize(pageSize.value)
);

const canPrev = computed(() => page.value > 1);

const canNext = computed(() => {
  const rowsLen = payroll.value?.rows?.length ?? 0;
  return rowsLen === clampPageSize(pageSize.value);
});

const toggleShowAll = async () => {
  showAll.value = !showAll.value;
  page.value = 1;
  await loadPayroll();
};

const nextPage = () => {
  if (!canNext.value || loading.value) return;
  page.value += 1;
  loadPayroll();
};

const prevPage = () => {
  if (!canPrev.value || loading.value) return;
  page.value -= 1;
  loadPayroll();
};

const applyFilters = () => {
  page.value = 1;
  loadPayroll();
};

/**
 * ============================================================
 * 2) ЛОКАЛЬНАЯ ЗАГРУЗКА (без API)
 * ============================================================
 */
const loadPayroll = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (!filters.value.month || !/^\d{4}-\d{2}$/.test(filters.value.month)) {
      throw new Error(
        'Параметр "month" обязателен в формате YYYY-MM (например, 2026-01).'
      );
    }

    // имитация сетевой задержки (можешь убрать)
    await new Promise((r) => setTimeout(r, 150));

    // 1) базовый набор
    let rows = [...TEST_PAYROLL_DATA];

    // 2) фильтр по месяцу (по полю date)
    rows = rows.filter((r) =>
      String(r.date || "").startsWith(filters.value.month)
    );

    // 3) employee_id
    if (filters.value.employee_id) {
      rows = rows.filter(
        (r) => String(r.employee_id) === String(filters.value.employee_id)
      );
    }

    // 4) project_id
    if (filters.value.project_id) {
      rows = rows.filter(
        (r) => String(r.project_id) === String(filters.value.project_id)
      );
    }

    // 5) task_id (частичное совпадение)
    if (filters.value.task_id) {
      const q = String(filters.value.task_id).trim();
      rows = rows.filter((r) => String(r.task_id).includes(q));
    }

    // 6) date range (по дате без времени)
    if (filters.value.date_from) {
      const from = new Date(filters.value.date_from + "T00:00:00");
      rows = rows.filter((r) => {
        const d = toDateSafe(r.date);
        return d ? d >= from : true;
      });
    }
    if (filters.value.date_to) {
      const to = new Date(filters.value.date_to + "T23:59:59");
      rows = rows.filter((r) => {
        const d = toDateSafe(r.date);
        return d ? d <= to : true;
      });
    }

    // 7) search (по сотруднику, задаче, проекту, comment)
    if (filters.value.search) {
      const s = String(filters.value.search).trim().toLowerCase();
      rows = rows.filter((r) => {
        const hay = [
          r.employee,
          r.task,
          r.project,
          r.comment,
          r.task_id,
          r.employee_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(s);
      });
    }

    // 8) сортировка (как обычно по дате desc)
    rows.sort((a, b) => {
      const da = toDateSafe(a.date)?.getTime() ?? 0;
      const db = toDateSafe(b.date)?.getTime() ?? 0;
      return db - da;
    });

    // 9) пагинация / showAll
    let pageRows = rows;
    if (!showAll.value) {
      const limit = clampPageSize(pageSize.value);
      const offset = offsetComputed.value;
      pageRows = rows.slice(offset, offset + limit);
    }

    // 10) итоги — считаем по ОТФИЛЬТРОВАННОМУ набору (не только на странице)
    const total_by_employee = rows.reduce((acc, r) => {
      const key = r.employee || "—";
      const sum = Number(r.amount) || 0;
      acc[key] = (acc[key] || 0) + sum;
      return acc;
    }, {});

    const grand_total = Object.values(total_by_employee).reduce(
      (s, v) => s + (Number(v) || 0),
      0
    );

    payroll.value = {
      month: filters.value.month,
      rows: pageRows,
      total_by_employee,
      grand_total,
    };
  } catch (err) {
    console.error(err);
    error.value = err?.message || "Неизвестная ошибка";
    payroll.value = null;
  } finally {
    loading.value = false;
  }
};

const selectEmployeeFromRow = async (row) => {
  if (!row?.employee_id) return;
  filters.value.employee_id = String(row.employee_id);
  page.value = 1;
  await loadPayroll();
};

const toDateSafe = (val) => {
  if (!val) return null;
  const safe = String(val).replace(" ", "T");
  const d = new Date(safe);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = toDateSafe(val);
  if (!d) return val;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (val) => {
  if (val === null || val === undefined) return "—";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(val);
};

const clearFilters = () => {
  filters.value = {
    month: getCurrentMonth(),
    employee_id: "",
    project_id: "",
    task_id: "",
    search: "",
    date_from: "",
    date_to: "",
  };

  showAll.value = false;
  pageSize.value = 20;
  page.value = 1;

  loadPayroll();
};

watch(pageSize, () => {
  if (showAll.value) return;
  page.value = 1;
  loadPayroll();
});

onMounted(() => {
  loadPayroll();
});
</script>

<style scoped>
* {
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}

.payroll-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  background: #f5f7fb;
}

.payroll-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 20px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payroll-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.payroll-card__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.payroll-card__title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.payroll-card__badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  white-space: nowrap;
}

.payroll-card__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.08s ease;
}

.payroll-card__action:hover:not(:disabled) {
  background: #f9fafb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.payroll-card__action:active:not(:disabled) {
  transform: translateY(0.5px);
}

.payroll-card__action:disabled {
  opacity: 0.5;
  cursor: default;
}

.payroll-card__action-icon {
  font-size: 14px;
}

.payroll-state {
  font-size: 14px;
  color: #4b5563;
}

.payroll-state--error {
  color: #b91c1c;
}

.payroll-skeleton-row {
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 40%, #e5e7eb 80%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.2s infinite linear;
  margin-bottom: 8px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.payroll-table-wrap {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  overflow-x: auto;
  overflow-y: hidden;
}

.payroll-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
  min-width: 900px;
}

.payroll-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f9fafb;
}

.payroll-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.payroll-table tbody tr {
  transition: background 0.12s ease;
}

.payroll-table tbody tr:nth-child(even) {
  background: #fcfcff;
}

.payroll-table tbody tr:hover {
  background: #eef2ff;
}

.payroll-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #edf0f4;
  color: #111827;
  vertical-align: top;
}

.col-employee {
  width: 120px;
}
.col-date {
  width: 100px;
}
.col-project {
  width: 120px;
}
.col-task {
  width: 120px;
}
.col-hours,
.col-rate,
.col-amount {
  width: 50px;
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cell-main__primary {
  font-weight: 500;
}
.cell-main__secondary {
  font-size: 11px;
  color: #6b7280;
}
.cell-muted {
  font-size: 12px;
  color: #9ca3af;
}

.chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid transparent;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.chip--project {
  background: #ecfdf3;
  border-color: #bbf7d0;
  color: #166534;
}

.task-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #1d4ed8;
  max-width: 100%;
}
.task-link__text {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.task-link__icon {
  font-size: 11px;
  opacity: 0.85;
}
.task-link:hover .task-link__text {
  text-decoration: underline;
}

.col-numeric {
  text-align: start;
  font-variant-numeric: tabular-nums;
}
.col-amount--accent {
  font-weight: 600;
  color: #16a34a;
}

.payroll-footer {
  padding-top: 8px;
}
.payroll-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;
  padding: 12px 14px;
  background: #f9fafb;
}
.payroll-summary__block {
  flex: 1 1 240px;
}
.payroll-summary__block--total {
  max-width: 260px;
}
.payroll-summary__title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.payroll-summary__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.payroll-summary__item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  padding: 3px 0;
}
.payroll-summary__name {
  color: #111827;
}
.payroll-summary__sum {
  font-weight: 500;
  color: #111827;
}
.payroll-summary__grand {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.payroll-summary__grand strong {
  font-size: 16px;
  font-weight: 700;
  color: #15803d;
}

.payroll-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 4px;
}

.filters-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.filter-item--wide {
  flex: 1 1 360px;
  min-width: 200px;
}

.filter-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.filter-item input[type="text"],
.filter-item input[type="search"],
.filter-item input[type="month"],
.filter-item input[type="date"],
.filter-item input[type="number"] {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  color: #111827;
  outline: none;
}

.filter-item input[type="month"],
.filter-item input[type="date"] {
  padding: 8px 10px;
}

.filter-item input:disabled {
  background: #f9fafb;
  opacity: 0.9;
}

.filters-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cell-main__primary--link {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: #1d4ed8;
  cursor: pointer;
  text-align: left;
  line-height: inherit;
}

.cell-main__primary--link:hover {
  text-decoration: underline;
}

.cell-main__primary--link:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.35);
  outline-offset: 2px;
  border-radius: 6px;
}

.payroll-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 6px 0;
}

.payroll-pagination__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 999px;
}

.payroll-pagination__dot {
  opacity: 0.6;
}

.payroll-state__alert {
  text-align: center;
  font-size: 25px;
}

.payroll-card__btn {
  width: fit-content;
}

.btn-payroll-card__wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .payroll-card {
    padding: 16px 12px 12px;
  }

  .payroll-page {
    padding: 16px 8px;
  }

  .payroll-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .payroll-table-wrap {
    overflow-x: auto;
  }

  .payroll-table {
    min-width: 720px;
  }

  .filters-row {
    gap: 8px;
  }
}
</style>
