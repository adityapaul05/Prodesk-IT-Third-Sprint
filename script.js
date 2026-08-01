(function(){
  const user1Input = document.getElementById('user1');
  const searchBtn = document.getElementById('searchBtn');
  const statusLine = document.getElementById('statusLine');
  const resultsArea = document.getElementById('resultsArea');
  const caseNo = document.getElementById('caseNo');
 
  const user2Input = document.getElementById('user2');
  const user2Field = document.getElementById('user2Field');
  const battleToggle = document.getElementById('battleToggle');
 
  caseNo.textContent = String(Math.floor(1000 + Math.random()*8999));
 
  battleToggle.addEventListener('change', () => {
    user2Field.style.display = battleToggle.checked ? '' : 'none';
    searchBtn.textContent = battleToggle.checked ? 'Open Face-off' : 'Open Case';
  });
 
  function formatDate(iso){
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = String(d.getDate()).padStart(2,'0');
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
 
  function escapeHtml(str){
    if(!str) return '';
    return str.replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }
 
  async function fetchUser(username){
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if(res.status === 404){
      const err = new Error('not_found');
      err.code = 404;
      throw err;
    }
    if(res.status === 403){
      const err = new Error('rate_limited');
      err.code = 403;
      throw err;
    }
    if(!res.ok){
      const err = new Error('unknown');
      err.code = res.status;
      throw err;
    }
    return res.json();
  }
 
  function dossierSkeleton(){
    return `
      <div>
        <div class="redact-row w40" style="height:60px; width:84px; display:inline-block; margin-right:14px; vertical-align:top;"></div>
        <div class="redact-row w60" style="display:inline-block; width:calc(100% - 100px);"></div>
        <div class="redact-row w90"></div>
        <div class="redact-row w70"></div>
        <div class="redact-row w40"></div>
      </div>
    `;
  }
 
  function renderLoading(dual){
    resultsArea.innerHTML = `
      <div class="redact-block">
        <p class="redact-tag">Pulling case records — do not disturb</p>
        <div class="${dual ? 'vs-grid dual' : ''}">
          ${dossierSkeleton()}
          ${dual ? '<div class="vs-divider">VS</div>' + dossierSkeleton() : ''}
        </div>
      </div>
    `;
  }
 
  function renderNotFound(username){
    resultsArea.innerHTML = `
      <div class="not-found">
        <strong>No Record Found</strong>
        Subject "${escapeHtml(username)}" does not exist in GitHub's records.<br/>
        Double-check the alias and reopen the case.
      </div>
    `;
  }
 
  function renderRateLimited(){
    resultsArea.innerHTML = `
      <div class="not-found">
        <strong>Access Restricted</strong>
        GitHub's unauthenticated rate limit (60/hr) has been reached for this network.<br/>
        Wait a while, or attach a personal access token to your requests.
      </div>
    `;
  }
 
  async function fetchRepos(reposUrl){
    const res = await fetch(`${reposUrl}?sort=created&direction=desc&per_page=100`);
    if(!res.ok) return [];
    return res.json();
  }
 
  function dossierHtml(user, repos, stampHtml){
    const top5 = (repos || [])
      .slice()
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0,5);
 
    const repoItems = top5.length
      ? top5.map(r => `
          <li>
            <a href="${r.html_url}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</a>
            <span class="star-tag">★ ${(r.stargazers_count || 0).toLocaleString()}</span>
          </li>
        `).join('')
      : '<li>No public repositories on file.</li>';
 
    return `
      <div class="dossier">
        ${stampHtml || ''}
        <div class="dossier-head">
          <img class="mugshot" src="${user.avatar_url}" alt="Avatar for ${escapeHtml(user.login)}" />
          <div class="dossier-id">
            <h2>${escapeHtml(user.name || user.login)}</h2>
            <div class="alias">@${escapeHtml(user.login)}</div>
          </div>
        </div>
        <dl class="facts">
          <dt>Statement</dt><dd>${escapeHtml(user.bio) || '<em>Subject declined to comment.</em>'}</dd>
          <dt>Case opened</dt><dd>${formatDate(user.created_at)}</dd>
          <dt>Known contact</dt><dd>${user.blog ? `<a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank" rel="noopener noreferrer">${escapeHtml(user.blog)}</a>` : '<em>None on file.</em>'}</dd>
          <dt>Public repos</dt><dd>${(user.public_repos || 0).toLocaleString()}</dd>
        </dl>
        <p class="assoc-title">Known associates — top 5 latest repositories</p>
        <ul class="assoc-list">${repoItems}</ul>
      </div>
    `;
  }
 
  async function runSearch(){
    const dual = battleToggle.checked;
    const name1 = user1Input.value.trim();
    const name2 = user2Input.value.trim();
 
    if(!name1 || (dual && !name2)){
      statusLine.textContent = dual
        ? 'Enter both subject aliases to open a face-off.'
        : 'Enter a subject alias to open a case.';
      return;
    }
 
    searchBtn.disabled = true;
    statusLine.textContent = 'Case in progress…';
    renderLoading(dual);
 
    try{
      if(!dual){
        const user = await fetchUser(name1);
        const repos = await fetchRepos(user.repos_url);
        resultsArea.innerHTML = dossierHtml(user, repos, '<div class="stamp green">Case Open</div>');
        statusLine.textContent = 'Record retrieved.';
      } else {
        const [res1, res2] = await Promise.all([
          fetchUser(name1).then(async u => ({ user: u, repos: await fetchRepos(u.repos_url) })),
          fetchUser(name2).then(async u => ({ user: u, repos: await fetchRepos(u.repos_url) }))
        ]);
 
        const stars1 = res1.repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
        const stars2 = res2.repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
 
        let stamp1 = '', stamp2 = '';
        if(stars1 > stars2){
          stamp1 = '<div class="stamp green">Winner</div>';
          stamp2 = '<div class="stamp red">Loser</div>';
        } else if(stars2 > stars1){
          stamp2 = '<div class="stamp green">Winner</div>';
          stamp1 = '<div class="stamp red">Loser</div>';
        } else {
          stamp1 = '<div class="stamp green">Tie</div>';
          stamp2 = '<div class="stamp green">Tie</div>';
        }
 
        resultsArea.innerHTML = `
          <div class="vs-grid dual">
            <div>
              ${dossierHtml(res1.user, res1.repos, stamp1)}
              <div class="total-stars">Total stars: ${stars1.toLocaleString()}</div>
            </div>
            <div class="vs-divider">VS</div>
            <div>
              ${dossierHtml(res2.user, res2.repos, stamp2)}
              <div class="total-stars">Total stars: ${stars2.toLocaleString()}</div>
            </div>
          </div>
        `;
        statusLine.textContent = 'Face-off resolved.';
      }
    } catch(err){
      if(err.code === 404){
        renderNotFound(dual ? `${name1} / ${name2}` : name1);
        statusLine.textContent = 'No record found.';
      } else if(err.code === 403){
        renderRateLimited();
        statusLine.textContent = 'Rate limited.';
      } else {
        resultsArea.innerHTML = `<div class="not-found"><strong>Case Error</strong>Something went wrong while contacting GitHub. Try again shortly.</div>`;
        statusLine.textContent = 'Unexpected error.';
      }
    } finally {
      searchBtn.disabled = false;
    }
  }
 
  user1Input.addEventListener('keydown', e => { if(e.key === 'Enter') runSearch(); });
  user2Input.addEventListener('keydown', e => { if(e.key === 'Enter') runSearch(); });
  searchBtn.addEventListener('click', runSearch);
})();