let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || '{}');
let allProjects = [];
let currentScriptProject = null;
let currentKeyProject = null;

if (!token) window.location.href = '/';

document.getElementById('username').textContent = user.username || 'Usuário';

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === 'projects') loadProjects();
    if (tab === 'scripts') loadProjectsForScripts();
    if (tab === 'keys') loadProjectsForKeys();
}

async function loadProjects() {
    try {
        const res = await fetch('/api/list-projects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            allProjects = data.projects;
            const grid = document.getElementById('projectsGrid');
            
            if (data.projects.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>Nenhum projeto ainda</h3><p>Crie seu primeiro projeto para começar!</p></div>';
            } else {
                grid.innerHTML = data.projects.map(p => `
                    <div class="card">
                        <h3>${p.name}</h3>
                        <p>${p.description || 'Sem descrição'}</p>
                        <div class="stats-badges">
                            <span class="badge badge-size">${p.stats?.totalKeys || 0} Keys</span>
                            <span class="badge badge-active">${p.stats?.activeKeys || 0} Ativas</span>
                            <span class="badge badge-executions">${p.stats?.totalValidations || 0} Validações</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
    }
}

async function createProject(e) {
    e.preventDefault();
    const name = document.getElementById('projectNameInput').value;
    const description = document.getElementById('projectDescInput').value;

    try {
        const res = await fetch('/api/create-project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });

        if (res.ok) {
            closeModal('createProject');
            document.getElementById('formCreateProject').reset();
            await loadProjects();
        }
    } catch (error) {
        alert('Erro ao criar projeto');
    }
}

async function loadProjectsForScripts() {
    await loadProjects();
    const select = document.getElementById('scriptProjectSelect');
    const uploadSelect = document.getElementById('uploadProjectSelect');
    
    select.innerHTML = '<option value="">Selecione um projeto</option>' +
        allProjects.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
    
    uploadSelect.innerHTML = '<option value="">Selecione um projeto</option>' +
        allProjects.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
}

async function loadScripts() {
    const projectId = document.getElementById('scriptProjectSelect').value;
    if (!projectId) {
        document.getElementById('scriptsGrid').innerHTML = '<div class="empty-state"><h3>Selecione um projeto</h3></div>';
        return;
    }

    currentScriptProject = projectId;

    try {
        const res = await fetch(`/api/list-scripts?projectId=${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const grid = document.getElementById('scriptsGrid');
            
            if (data.scripts.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>Nenhum script ainda</h3><p>Faça upload do seu primeiro script!</p></div>';
            } else {
                grid.innerHTML = data.scripts.map(s => `
                    <div class="card">
                        <h3>${s.scriptName}</h3>
                        <p>Script ID: <span class="card-code">${s.scriptId}</span></p>
                        <p>Upload: ${new Date(s.uploadedAt).toLocaleDateString()}</p>
                        <div class="stats-badges">
                            <span class="badge badge-executions">⚡ ${s.executions || 0} execuções</span>
                            <span class="badge badge-size">📦 ${(s.scriptContent.length / 1024).toFixed(1)} KB</span>
                        </div>
                        <div class="card-actions">
                            <button class="btn-small btn-view" onclick="viewLoader('${s.scriptId}', '${s.scriptName.replace(/'/g, "\\'")}')">📋 Ver Loader</button>
                            <button class="btn-small btn-delete" onclick="deleteScript('${s.scriptId}')">🗑️ Deletar</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar scripts:', error);
    }
}

async function uploadScript(e) {
    e.preventDefault();
    const projectId = document.getElementById('uploadProjectSelect').value;
    const scriptName = document.getElementById('scriptNameInput').value;
    const scriptContent = document.getElementById('scriptContentInput').value;

    if (!projectId) {
        alert('Selecione um projeto!');
        return;
    }

    try {
        const res = await fetch('/api/upload-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ projectId, scriptName, scriptContent })
        });

        const data = await res.json();

        if (data.success) {
            alert(`✅ Script enviado! Script ID: ${data.scriptId}`);
            closeModal('uploadScript');
            document.getElementById('formUploadScript').reset();
            
            document.getElementById('scriptProjectSelect').value = projectId;
            await loadScripts();
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
        alert('Erro ao enviar script');
    }
}

function viewLoader(scriptId, scriptName) {
    const loaderCode = `_G.SCRIPT_KEY = "SUA-KEY-AQUI" -- MUDE AQUI!
loadstring(game:HttpGet("${window.location.origin}/loader/${scriptId}"))()`;

    document.getElementById('loaderTitle').textContent = `📋 Loader - ${scriptName}`;
    document.getElementById('loaderCodeContent').textContent = loaderCode;
    showModal('viewLoader');
}

function copyLoaderCode() {
    const code = document.getElementById('loaderCodeContent').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copiado!';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
}

async function deleteScript(scriptId) {
    if (!confirm('Deletar este script permanentemente?')) return;

    try {
        const res = await fetch('/api/delete-script', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ scriptId })
        });

        if (res.ok) {
            await loadScripts();
        }
    } catch (error) {
        alert('Erro ao deletar script');
    }
}

async function loadProjectsForKeys() {
    await loadProjects();
    const select = document.getElementById('keyProjectSelect');
    
    select.innerHTML = '<option value="">Selecione um projeto</option>' +
        allProjects.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
}

async function loadKeys() {
    const projectId = document.getElementById('keyProjectSelect').value;
    if (!projectId) {
        document.getElementById('keysGrid').innerHTML = '<div class="empty-state"><h3>Selecione um projeto</h3></div>';
        return;
    }

    currentKeyProject = projectId;

    try {
        const res = await fetch(`/api/list-keys?projectId=${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const grid = document.getElementById('keysGrid');
            
            if (data.keys.length === 0) {
                grid.innerHTML = '<div class="empty-state"><h3>Nenhuma key ainda</h3><p>Gere sua primeira key!</p></div>';
            } else {
                grid.innerHTML = data.keys.map(k => {
                    const statusBadge = k.status === 'active' ? 'badge-active' : 
                                        k.status === 'pending' ? 'badge-pending' : 'badge-size';
                    return `
                    <div class="card">
                        <h3 class="card-code">${k.key}</h3>
                        <p>Status: <span class="badge ${statusBadge}">${k.status.toUpperCase()}</span></p>
                        <p>Duração: ${k.duration === 0 ? 'Lifetime' : k.duration + ' dias'}</p>
                        <p>Expira: ${k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'Aguardando uso'}</p>
                        <p>Usos: ${k.usageCount || 0}</p>
                        ${k.note ? `<p>Nota: ${k.note}</p>` : ''}
                        <div class="card-actions">
                            ${k.hwid ? `<button class="btn-small btn-view" onclick="resetHWID('${k._id}')">🔄 Reset HWID</button>` : ''}
                            <button class="btn-small btn-delete" onclick="deleteKey('${k._id}')">🗑️ Deletar</button>
                        </div>
                    </div>
                `}).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar keys:', error);
    }
}

async function generateKey(e) {
    e.preventDefault();
    
    if (!currentKeyProject) {
        alert('Selecione um projeto primeiro!');
        return;
    }

    const duration = document.getElementById('keyDurationInput').value;
    const note = document.getElementById('keyNoteInput').value;

    try {
        const res = await fetch('/api/generate-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ projectId: currentKeyProject, duration, note })
        });

        if (res.ok) {
            closeModal('generateKey');
            document.getElementById('formGenerateKey').reset();
            await loadKeys();
        }
    } catch (error) {
        alert('Erro ao gerar key');
    }
}

async function resetHWID(keyId) {
    if (!confirm('Resetar o HWID desta key?')) return;

    try {
        const res = await fetch('/api/reset-hwid', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ keyId })
        });

        if (res.ok) await loadKeys();
    } catch (error) {
        alert('Erro ao resetar HWID');
    }
}

async function deleteKey(keyId) {
    if (!confirm('Deletar esta key permanentemente?')) return;

    try {
        const res = await fetch('/api/delete-key', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ keyId })
        });

        if (res.ok) {
            await loadKeys();
        }
    } catch (error) {
        alert('Erro ao deletar key');
    }
}

function showModal(modal) {
    const modalId = 'modal' + modal.charAt(0).toUpperCase() + modal.slice(1);
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modal) {
    const modalId = 'modal' + modal.charAt(0).toUpperCase() + modal.slice(1);
    document.getElementById(modalId).classList.remove('show');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

loadProjects();
