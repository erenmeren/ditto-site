#!/usr/bin/env python3
"""Screenshot a page the way a reader actually meets it.

`shoot.sh` takes one full-page capture per condition. That is the right tool
for "is everything present", and the wrong tool for anything driven by
scrolling: Firefox's --screenshot never scrolls, so an IntersectionObserver
reveal below the fold NEVER FIRES, and every element still sitting at
opacity:0 is captured invisible.

That failure mode cost this project real work. Two directions independently
deleted their scroll reveals after seeing blank sections in a full-page
capture — the tool silently argued them out of motion the brief asked for.
This script exists so that argument cannot be made again.

Two modes:

  walk    scroll to the bottom in viewport-sized steps, letting every
          observer fire, return to the top, then take ONE full-page shot
          with every reveal already resolved. Use this instead of shoot.sh
          when a page has scroll-triggered motion.

  frames  viewport screenshots at chosen scroll offsets, for judging what a
          reader sees at a moment rather than what the document contains.

Usage:
  URL=http://localhost:8940/a/index.html OUT=/tmp/x ./scrollshot.py walk
  URL=... OUT=/tmp/x SCROLLS=0,240,480 W=1440 H=900 ./scrollshot.py frames

Env: URL, OUT, W (1440), H (900), SCROLLS (frames mode), REDUCE=1 to force
prefers-reduced-motion, SETTLE (seconds to wait per step, default 0.7).
"""
import base64, json, os, shutil, socket, subprocess, sys, tempfile, time

MODE = (sys.argv[1] if len(sys.argv) > 1 else "walk").lower()
URL = os.environ.get("URL") or sys.exit("URL is required")
OUT = os.environ.get("OUT", "/tmp/scrollshot")
W = int(os.environ.get("W", "1440"))
H = int(os.environ.get("H", "900"))
REDUCE = os.environ.get("REDUCE", "0") == "1"
SETTLE = float(os.environ.get("SETTLE", "0.7"))
MPORT = int(os.environ.get("MPORT", "2829"))

os.makedirs(OUT, exist_ok=True)
prof = tempfile.mkdtemp()
with open(os.path.join(prof, "user.js"), "w") as f:
    f.write('user_pref("marionette.port", %d);\n' % MPORT)
    f.write('user_pref("marionette.enabled", true);\n')
    if REDUCE:
        f.write('user_pref("ui.prefersReducedMotion", 1);\n')

ff = subprocess.Popen(
    ["firefox", "--headless", "--marionette", "--profile", prof,
     "--window-size=%d,%d" % (W, H), "about:blank"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

sock = None
for _ in range(120):
    try:
        sock = socket.create_connection(("127.0.0.1", MPORT), 1)
        break
    except OSError:
        time.sleep(0.5)
if sock is None:
    ff.kill(); sys.exit("could not reach marionette on %d" % MPORT)
sock.settimeout(60)

buf = b""
def recv():
    global buf
    while b":" not in buf:
        buf += sock.recv(65536)
    n, _, rest = buf.partition(b":")
    n, buf = int(n), rest
    while len(buf) < n:
        buf += sock.recv(65536)
    msg, buf = buf[:n], buf[n:]
    return json.loads(msg)

recv()  # hello
_id = [0]
def cmd(name, params=None):
    _id[0] += 1
    payload = json.dumps([0, _id[0], name, params or {}]).encode()
    sock.sendall(b"%d:%s" % (len(payload), payload))
    r = recv()
    if r[2]:
        raise RuntimeError("%s -> %s" % (name, json.dumps(r[2])[:400]))
    return r[3]

def js(script, args=None):
    return cmd("WebDriver:ExecuteScript",
               {"script": script, "args": args or [], "sandbox": "default"})["value"]

def shot(path, full):
    png = cmd("WebDriver:TakeScreenshot", {"full": full, "hash": False})["value"]
    with open(path, "wb") as fh:
        fh.write(base64.b64decode(png))
    return path

try:
    cmd("WebDriver:NewSession", {"capabilities": {}})
    cmd("WebDriver:SetWindowRect", {"width": W, "height": H})
    cmd("WebDriver:Navigate", {"url": URL})
    time.sleep(2.0)

    if MODE == "walk":
        height = js("return document.documentElement.scrollHeight")
        step = max(1, int(H * 0.8))
        pos = 0
        while pos < height:
            js("window.scrollTo(0, arguments[0]);", [pos])
            time.sleep(SETTLE)
            pos += step
        js("window.scrollTo(0, document.documentElement.scrollHeight);")
        time.sleep(SETTLE)
        js("window.scrollTo(0, 0);")
        time.sleep(SETTLE)
        out = shot(os.path.join(OUT, "walked-%d.png" % W), True)
        # A reveal left at opacity 0 after a full walk is a real bug, not a
        # capture artefact — report it rather than letting it pass as "blank".
        hidden = js("""
          return [...document.querySelectorAll('*')].filter(function(e){
            var s = getComputedStyle(e);
            return parseFloat(s.opacity) < 0.05
                && e.getBoundingClientRect().height > 24
                && s.position !== 'fixed';
          }).length;
        """)
        print(json.dumps({"mode": "walk", "documentHeight": height,
                          "stillHidden": hidden, "shot": out}))
        if hidden:
            print("WARNING: %d element(s) remain at opacity<0.05 after a full "
                  "scroll walk — these are genuinely stuck, not a capture "
                  "artefact." % hidden, file=sys.stderr)
    elif MODE == "frames":
        scrolls = [int(x) for x in os.environ.get("SCROLLS", "0,240,480,720").split(",")]
        for s in scrolls:
            js("window.scrollTo(0, arguments[0]);", [s])
            time.sleep(SETTLE)
            print(json.dumps({"scrollY": js("return window.scrollY"),
                              "shot": shot(os.path.join(OUT, "y%05d.png" % s), False)}))
    else:
        sys.exit("unknown mode %r — use walk or frames" % MODE)
finally:
    try:
        cmd("Marionette:Quit")
    except Exception:
        pass
    ff.terminate()
    shutil.rmtree(prof, ignore_errors=True)
