import React, { useEffect, useState } from 'react';

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('/api/staff/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error(err));
  }, []);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'task-priority priority-high';
      case 'mid': return 'task-priority priority-mid';
      case 'low': return 'task-priority priority-low';
      default: return 'task-priority priority-mid';
    }
  };

  const todoTasks = tasks.filter(t => t.column === 'todo');
  const inProgressTasks = tasks.filter(t => t.column === 'in_progress');
  const doneTasks = tasks.filter(t => t.column === 'done');

  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">{tasks.length} công việc</div>
          <h1>Công việc</h1>
          <p>Theo dõi các đầu việc liên quan đến học viên bạn phụ trách.</p>
        </div>
        <div className="topbar-right">
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm việc
          </button>
        </div>
      </div>

      <div className="task-board">
        {/* Cột Cần làm */}
        <div className="task-col">
          <div className="task-col-head">
            <h4><span className="task-dot" style={{ background: 'var(--coral)' }}></span>Cần làm</h4>
            <span className="task-count">{todoTasks.length}</span>
          </div>
          <div className="task-col-body">
            {todoTasks.map((t) => (
              <div className="task-card" key={t.id}>
                <div className="task-card-title">{t.title}</div>
                <div className="task-card-student">👤 {t.student}</div>
                <div className="task-card-footer">
                  <span className={getPriorityClass(t.priority)}>{t.priorityText}</span>
                  <span className="task-due">{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột Đang xử lý */}
        <div className="task-col">
          <div className="task-col-head">
            <h4><span className="task-dot" style={{ background: 'var(--gold)' }}></span>Đang xử lý</h4>
            <span className="task-count">{inProgressTasks.length}</span>
          </div>
          <div className="task-col-body">
            {inProgressTasks.map((t) => (
              <div className="task-card" key={t.id}>
                <div className="task-card-title">{t.title}</div>
                <div className="task-card-student">👤 {t.student}</div>
                <div className="task-card-footer">
                  <span className={getPriorityClass(t.priority)}>{t.priorityText}</span>
                  <span className="task-due">{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột Hoàn thành */}
        <div className="task-col">
          <div className="task-col-head">
            <h4><span className="task-dot" style={{ background: 'var(--green)' }}></span>Hoàn thành</h4>
            <span className="task-count">{doneTasks.length}</span>
          </div>
          <div className="task-col-body">
            {doneTasks.map((t) => (
              <div className="task-card" key={t.id} style={{ opacity: 0.6 }}>
                <div className="task-card-title">{t.title}</div>
                <div className="task-card-student">👤 {t.student}</div>
                <div className="task-card-footer">
                  <span className={getPriorityClass(t.priority)}>{t.priorityText}</span>
                  <span className="task-due">{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
