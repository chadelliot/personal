/* Externalized scripts for Chad Parker resume landing page */

async function inlineExternalSvg(container) {
  const src = container.dataset.svgSrc;
  if (!src) return;
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to load SVG: ${src}`);
  container.innerHTML = await response.text();
  const svg = container.querySelector('svg');
  if (svg) {
    svg.removeAttribute('width');
    svg.removeAttribute('height');
  }
}

async function loadExternalSvgs() {
  const containers = Array.from(document.querySelectorAll('[data-svg-src]'));
  await Promise.all(containers.map(inlineExternalSvg));
}

async function initPage() {
  // ── Cursor ──
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    cursor.style.left=mx-4+'px'; cursor.style.top=my-4+'px';
  });
  (function animRing(){
    rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
    ring.style.left=rx-18+'px'; ring.style.top=ry-18+'px';
    requestAnimationFrame(animRing);
  })();

  // ── Generic scroll observer ──
  function onVisible(el, cb, threshold=0.2) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) { cb(e.target); } });
    }, {threshold}).observe(el);
  }

  // ── Timeline items ──
  document.querySelectorAll('.timeline-item').forEach((item,i) => {
    onVisible(item, el => setTimeout(() => el.classList.add('visible'), i*120));
  });

  // ═══════════════════════════════════════
  // MY CONTRIBUTION — progressive scroll reveal
  // node 1 → arrow 1 draws → node 2 → arrow 2 draws → node 3
  // ═══════════════════════════════════════
  const storyCanvas = document.getElementById('storyCanvas');

  function drawArrow(pathId, headId, delay=0) {
    return new Promise(resolve => {
      setTimeout(() => {
        const p = document.getElementById(pathId);
        const len = p.getTotalLength ? p.getTotalLength() : 300;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.style.transition = 'stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1)';
        // Force reflow so transition fires
        p.getBoundingClientRect();
        p.style.strokeDashoffset = '0';
        const head = document.getElementById(headId);
        setTimeout(() => { head.classList.add('drawn'); resolve(); }, 820);
      }, delay);
    });
  }

  function showNode(id, delay=0) {
    return new Promise(resolve => {
      setTimeout(() => {
        document.getElementById(id).classList.add('visible');
        resolve();
      }, delay);
    });
  }

  onVisible(storyCanvas, async () => {
    await showNode('storyNode1');                    // node 1 fades in
    await new Promise(r => setTimeout(r, 600));      // brief pause
    await drawArrow('arrow1', 'arrowhead1');         // arrow 1 draws
    await new Promise(r => setTimeout(r, 200));      // tiny gap
    await showNode('storyNode2');                    // node 2 fades in
    await new Promise(r => setTimeout(r, 600));      // brief pause
    await drawArrow('arrow2', 'arrowhead2');         // arrow 2 draws
    await new Promise(r => setTimeout(r, 200));      // tiny gap
    await showNode('storyNode3');                    // node 3 fades in
  }, 0.15);

  // ═══════════════════════════════════════
  // DATA ORCHESTRATION — wire paths from sources to CDP to outputs
  // ═══════════════════════════════════════
  function buildOrchWires() {
    const container = document.getElementById('orchContainer');
    const svg = document.getElementById('orchSvg');
    const cW = container.offsetWidth;
    const cH = container.offsetHeight;

    // Center point
    const cx = cW / 2;
    const cy = cH / 2;

    // Get element center relative to container
    function elCenter(id) {
      const el = document.getElementById(id);
      if (!el) return {x:0,y:0};
      const r = el.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      return { x: r.left - cr.left + r.width/2, y: r.top - cr.top + r.height/2 };
    }

    const sources = ['src-crm','src-web','src-pos','src-email','src-mobile','src-partner'];
    const outputs = ['out-seg','out-camp','out-loy','out-attr','out-nba'];

    svg.innerHTML = '';

    // Draw dashed input lines src → CDP
    sources.forEach((id, i) => {
      const s = elCenter(id);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      // curved bezier toward center
      const mx2 = (s.x + cx)/2;
      const d = `M ${s.x} ${s.y} C ${mx2} ${s.y} ${mx2} ${cy} ${cx} ${cy}`;
      path.setAttribute('d', d);
      path.setAttribute('fill','none');
      path.setAttribute('stroke','#252530');
      path.setAttribute('stroke-width','1');
      path.setAttribute('stroke-dasharray','4 6');
      path.setAttribute('class','orch-input-path');
      path.style.opacity = '0';
      path.style.transition = `opacity 0.4s ease ${0.1+i*0.12}s`;
      svg.appendChild(path);
    });

    // Draw solid output lines CDP → outputs
    outputs.forEach((id, i) => {
      const o = elCenter(id);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      const mx2 = (cx + o.x)/2;
      const d = `M ${cx} ${cy} C ${mx2} ${cy} ${mx2} ${o.y} ${o.x} ${o.y}`;
      const len = path.getTotalLength ? 400 : 400;
      path.setAttribute('d', d);
      path.setAttribute('fill','none');
      path.setAttribute('stroke','#2FA37F');
      path.setAttribute('stroke-width','1.5');
      path.setAttribute('opacity','0');
      path.style.strokeDasharray = '400';
      path.style.strokeDashoffset = '400';
      path.style.transition = `stroke-dashoffset 0.8s ease ${0.8+i*0.15}s, opacity 0.1s ease ${0.8+i*0.15}s`;
      svg.appendChild(path);
    });

    return { sources, outputs };
  }

  const orchContainer = document.getElementById('orchContainer');
  onVisible(orchContainer, () => {
    const { sources, outputs } = buildOrchWires();

    // Show sources
    sources.forEach((id,i) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        el.classList.add('visible');
        setTimeout(()=>el.classList.add('active'), 200);
      }, i * 130);
    });

    // Show center
    setTimeout(() => document.getElementById('orchCenter').classList.add('visible'), 600);

    // Activate input wires
    setTimeout(() => {
      document.querySelectorAll('.orch-input-path').forEach(p => {
        p.style.opacity = '0.6';
        p.style.stroke = '#3a3a50';
        p.style.animation = 'flowDash 2.5s linear infinite';
      });
    }, 700);

    // Show outputs with wire draw
    outputs.forEach((id,i) => {
      setTimeout(() => {
        document.getElementById(id).classList.add('visible');
      }, 900 + i*150);
    });

    // Draw output wires
    setTimeout(() => {
      const paths = document.querySelectorAll('#orchSvg path');
      const outPaths = Array.from(paths).slice(sources.length);
      outPaths.forEach((p,i) => {
        p.setAttribute('opacity','0.7');
        p.style.strokeDashoffset = '0';
      });
    }, 950);
  }, 0.1);

  // Rebuild wires on resize
  window.addEventListener('resize', () => {
    buildOrchWires();
  });

  // ═══════════════════════════════════════
  // RFM Segmentation — bar animations + dim switching
  // ═══════════════════════════════════════
  const segGrid = document.getElementById('segGrid');
  onVisible(segGrid, () => {
    document.querySelectorAll('.seg-bar').forEach((bar, i) => {
      setTimeout(() => {
        bar.style.width = bar.dataset.width + '%';
      }, i * 150);
    });
  }, 0.2);

  // RFM dims are static display only

  // ── Impact counters ──
  function animateCounter(el, to, prefix='', suffix='', decimals=0) {
    const dur = 1800;
    const start = performance.now();
    function upd(now) {
      const t = Math.min((now-start)/dur,1);
      const ease = 1-Math.pow(1-t,3);
      const val = ease*to;
      el.textContent = prefix + (decimals>0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + suffix;
      if(t<1) requestAnimationFrame(upd);
    }
    requestAnimationFrame(upd);
  }

  // ── Timeline metric counters (animate when each timeline item becomes visible) ──
  document.querySelectorAll('.timeline-item').forEach(item => {
    onVisible(item, () => {
      item.querySelectorAll('.metric-value[data-counter]').forEach(el => {
        const to = parseFloat(el.dataset.counter);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0');
        animateCounter(el, to, prefix, suffix, decimals);
      });
    }, 0.3);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadExternalSvgs();
    await initPage();
  } catch (error) {
    console.error(error);
  }
});
