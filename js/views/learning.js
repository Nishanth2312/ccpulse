/**
 * CCPulse Learning Academy View
 */
const LearningView = {
    activeCourseSlug: null,

    async render(container, selectedSlug = null) {
        if (selectedSlug) {
            return this.renderCourseDetail(container, selectedSlug);
        }

        let courses = [];
        try {
            const res = await API.learning.getCourses();
            courses = res.courses || [];
        } catch (e) {
            courses = [];
        }

        container.innerHTML = `
            <div style="margin-bottom: 28px;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 6px;">
                    <i class="fa-solid fa-graduation-cap text-cyan"></i> Learning Academy
                </h1>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">
                    Master cryptocurrency protocols, privacy mechanics (Monero & Beldex), and risk sizing principles.
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
                ${courses.map(course => {
                    const diffColors = {
                        Beginner: 'var(--color-success)',
                        Intermediate: 'var(--color-primary)',
                        Advanced: '#F59E0B'
                    };
                    const diffColor = diffColors[course.difficulty] || 'var(--text-muted)';

                    return `
                        <div class="glass-card" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <span style="font-size: 0.75rem; font-weight: 700; color: ${diffColor}; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: var(--border-radius-full); border: 1px solid ${diffColor};">
                                        ${course.difficulty}
                                    </span>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">
                                        <i class="fa-regular fa-clock"></i> ${course.duration_minutes} mins
                                    </span>
                                </div>
                                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">
                                    ${course.title}
                                </h3>
                                <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 20px;">
                                    ${course.summary}
                                </p>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
                                    <span>${course.modules_count} Modules</span>
                                    <span>${course.category}</span>
                                </div>
                                <a href="#learning/${course.slug}" class="btn btn-primary" style="width: 100%;">
                                    <i class="fa-solid fa-book-open"></i> Start Course
                                </a>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    async renderCourseDetail(container, slug) {
        try {
            const res = await API.learning.getCourse(slug);
            const { course, userProgress } = res;

            container.innerHTML = `
                <div style="margin-bottom: 24px;">
                    <a href="#learning" style="color: var(--color-primary); font-size: 0.9rem; font-weight: 600;">
                        <i class="fa-solid fa-arrow-left"></i> Back to Academy
                    </a>
                </div>

                <div class="glass-card" style="padding: 32px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">
                                ${course.category} &bull; ${course.difficulty}
                            </span>
                            <h1 style="font-size: 1.8rem; font-weight: 800; margin-top: 6px;">${course.title}</h1>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.85rem; color: var(--text-muted);">
                                Completion Status: <strong style="color: ${userProgress.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'};">${userProgress.status.toUpperCase()}</strong>
                            </span>
                        </div>
                    </div>

                    <p style="font-size: 1rem; line-height: 1.7; color: var(--text-secondary); margin-bottom: 24px;">
                        ${course.summary}
                    </p>

                    <!-- Module List -->
                    <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 16px;">
                        Course Curriculum (${course.modules.length} Modules)
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;" id="modules-list">
                        ${course.modules.map((m, idx) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: 8px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(0,240,255,0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem;">
                                        ${idx + 1}
                                    </div>
                                    <span style="font-weight: 600; font-size: 0.95rem;">${m.title}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">${m.readTime}</span>
                                    <button type="button" class="btn btn-outline mark-module-btn" data-mod="${idx + 1}" style="font-size: 0.78rem; padding: 4px 10px;">
                                        <i class="fa-solid fa-check"></i> Complete
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                        <button type="button" id="complete-all-btn" class="btn btn-primary">
                            <i class="fa-solid fa-award"></i> Mark All Completed & Save Progress
                        </button>
                    </div>
                </div>
            `;

            // Attach completion events
            container.querySelectorAll('.mark-module-btn').forEach(btn => {
                btn.onclick = async () => {
                    const modNum = parseInt(btn.getAttribute('data-mod'), 10);
                    try {
                        await API.learning.updateProgress({
                            course_id: course.id,
                            completed_modules: modNum,
                            total_modules: course.modules.length
                        });
                        btn.className = 'btn btn-primary';
                        btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Done';
                    } catch (e) {
                        alert(e.message);
                    }
                };
            });

            const completeAllBtn = container.querySelector('#complete-all-btn');
            if (completeAllBtn) {
                completeAllBtn.onclick = async () => {
                    try {
                        await API.learning.updateProgress({
                            course_id: course.id,
                            completed_modules: course.modules.length,
                            total_modules: course.modules.length
                        });
                        completeAllBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Course Completed!';
                        completeAllBtn.disabled = true;
                    } catch (e) {
                        alert(e.message);
                    }
                };
            }

        } catch (e) {
            container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--color-danger);">${e.message}</div>`;
        }
    }
};

window.LearningView = LearningView;

