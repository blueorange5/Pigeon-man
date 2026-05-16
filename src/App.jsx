import "./App.css"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import emailjs from "@emailjs/browser"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "./firebase"

import sky from "./assets/sky.png"
import pigeon from "./assets/pigeon.png"
import scroll from "./assets/scroll.png"
// import missile from "./assets/missile.png"  ← drop missile.png in assets/ and uncomment

const FIELDS = [
  { key: "senderName",    placeholder: "Your name, soldier...",                  type: "text"     },
  { key: "senderEmail",   placeholder: "Your carrier pigeon address (email)...", type: "email"    },
  { key: "receiverName",  placeholder: "Who receives this message?",             type: "text"     },
  { key: "receiverEmail", placeholder: "Receiver's pigeon address (email)...",   type: "email"    },
  { key: "message",       placeholder: "Write your war-time letter...",          type: "textarea" },
]

const WAR_MISSILE_MESSAGES = [
  "⚠️ Enemy aircraft spotted! Use pigeons — radios are compromised.",
  "🔥 The skies are not safe. Only feathers can carry our words now.",
  "💣 Every missile fired means another pigeon must fly.",
  "🪖 In war, trust no wire. Trust only wings.",
  "📡 All communication lines are down. Pigeons are our last hope.",
  "🚀 They shoot our planes. But they can't shoot every pigeon.",
  "⚔️ The front lines are silent — except for the flutter of wings.",
]

const WAR_FLAVOURS = [
  "🕊️ A pigeon cuts through the smoke...",
  "📜 From the front lines...",
  "🔥 Written under fire...",
  "⚔️ Delivered through enemy skies...",
  "🪖 A soldier's words, carried by wings...",
]

// Pre-defined fliers: goingRight true = L→R, false = R→L
// They animate from -150px to calc(100vw+150px) or vice-versa so they truly exit the screen
const STATIC_FLIERS = [
  { id: 0,  goingRight: true,  yPct: 12, duration: 20, delay: 0,   type: "pigeon"  },
  { id: 1,  goingRight: false, yPct: 22, duration: 24, delay: 3,   type: "pigeon"  },
  { id: 2,  goingRight: true,  yPct: 38, duration: 11, delay: 6,   type: "missile" },
  { id: 3,  goingRight: true,  yPct: 17, duration: 18, delay: 1.5, type: "pigeon"  },
  { id: 4,  goingRight: false, yPct: 48, duration: 16, delay: 9,   type: "pigeon"  },
  { id: 5,  goingRight: false, yPct: 28, duration: 26, delay: 4,   type: "pigeon"  },
  { id: 6,  goingRight: false, yPct: 58, duration: 10, delay: 11,  type: "missile" },
  { id: 7,  goingRight: false, yPct: 42, duration: 21, delay: 7,   type: "pigeon"  },
  { id: 8,  goingRight: true,  yPct: 65, duration: 23, delay: 2,   type: "pigeon"  },
  { id: 9,  goingRight: true,  yPct: 33, duration: 13, delay: 14,  type: "missile" },
]

export default function App() {
  const WEBSITE_URL = "https://pigeon-man.vercel.app"

  const [worldLetters, setWorldLetters]         = useState([])
  const [selectedMessage, setSelectedMessage]   = useState(null)

  // Send flow
  const [sending, setSending]         = useState(false)
  const [currentField, setCurrentField] = useState(0)
  const [formData, setFormData]       = useState({ senderName: "", senderEmail: "", receiverName: "", receiverEmail: "", message: "" })
  const [fieldValue, setFieldValue]   = useState("")
  const [done, setDone]               = useState(false)

  // Read flow
  const [reading, setReading]           = useState(false)
  const [searchEmail, setSearchEmail]   = useState("")
  const [foundLetters, setFoundLetters] = useState([])
  const [inboundPigeons, setInboundPigeons] = useState([])
  const [searched, setSearched]         = useState(false)

  const inputRef = useRef(null)

  useEffect(() => { loadWorldLetters() }, [])
  useEffect(() => { if (sending && inputRef.current) inputRef.current.focus() }, [sending, currentField])

  async function loadWorldLetters() {
    const snapshot = await getDocs(collection(db, "letters"))
    const letters = []
    snapshot.forEach(doc => letters.push({ id: doc.id, ...doc.data() }))
    setWorldLetters(letters)
  }

  function startSending() {
    setSending(true); setCurrentField(0); setFieldValue("")
    setFormData({ senderName: "", senderEmail: "", receiverName: "", receiverEmail: "", message: "" })
    setDone(false)
  }

  function handleNext() {
    if (!fieldValue.trim()) return
    const updated = { ...formData, [FIELDS[currentField].key]: fieldValue.trim() }
    setFormData(updated); setFieldValue("")
    if (currentField < FIELDS.length - 1) setCurrentField(currentField + 1)
    else submitLetter(updated)
  }

  async function submitLetter(data) {
    try {
      await addDoc(collection(db, "letters"), { ...data, createdAt: Date.now() })
      await emailjs.send("service_nkf4bj5", "template_yg1vy7s", {
        sender_name: data.senderName, receiver_name: data.receiverName,
        receiver_email: data.receiverEmail, pigeon_link: WEBSITE_URL,
      }, "yt1sGLx6DMWfhP3hC")
      setDone(true); loadWorldLetters()
      setTimeout(() => { setSending(false); setDone(false) }, 3000)
    } catch (e) { console.error(e); alert("The pigeon got shot down. Try again.") }
  }

  async function openPigeons() {
    if (!searchEmail.trim()) return
    const snapshot = await getDocs(collection(db, "letters"))
    const letters = []
    snapshot.forEach(doc => {
      const d = doc.data()
      if (d.receiverEmail?.toLowerCase() === searchEmail.toLowerCase()) letters.push(d)
    })
    setFoundLetters(letters)
    setReading(false) // close modal immediately

    if (letters.length === 0) {
      alert("No pigeons found for this address.")
      return
    }

    // Arrange pigeons in a cluster at screen center, spread out in a grid-ish pattern
    const cols = Math.min(letters.length, 4)
    setInboundPigeons(letters.map((letter, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      // Center cluster: viewport center ± offsets
      // landX/landY are in vw/vh units relative to viewport, we'll use fixed positioning
      const totalCols = Math.min(letters.length, cols)
      const offsetX = (col - (totalCols - 1) / 2) * 110  // px spread horizontally
      const offsetY = (row - 0.5) * 110                   // px spread vertically
      return {
        uid: `inbound-${i}-${Date.now()}`,
        letter,
        offsetX, // px from center
        offsetY, // px from center
        delay: i * 0.35,
        fromRight: i % 2 === 1, // alternate entry side
      }
    }))
  }

  function openScrollFromLetter(letter) {
    setSelectedMessage({
      isMissile: false,
      flavour: WAR_FLAVOURS[Math.floor(Math.random() * WAR_FLAVOURS.length)],
      senderName: letter.senderName,
      message: letter.message,
    })
    setInboundPigeons(prev => prev.filter(p => p.letter !== letter))
  }

  function clickMissile() {
    setSelectedMessage({
      isMissile: true,
      missileMsg: WAR_MISSILE_MESSAGES[Math.floor(Math.random() * WAR_MISSILE_MESSAGES.length)],
    })
  }

  function clickWorldPigeon(letter) {
    if (!letter) return
    openScrollFromLetter(letter)
  }

  const progress = (currentField / FIELDS.length) * 100

  return (
    <div style={{
      backgroundImage: `url(${sky})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      width: "100vw",
      minHeight: "100vh",
      overflow: "hidden",
      position: "relative",
      fontFamily: "'Georgia', serif",
    }}>

      {/* ── STATIC FLIERS: pigeons + missiles crossing full screen ── */}
      {STATIC_FLIERS.map((flier, i) => {
        const letter = worldLetters.length > 0 ? worldLetters[i % worldLetters.length] : null
        const isMissile = flier.type === "missile"
        const flip = flier.goingRight ? 1 : -1
        // Start/end positions: truly off-screen on both sides
        const startX = flier.goingRight ? "-150px" : "calc(100vw + 150px)"
        const endX   = flier.goingRight ? "calc(100vw + 150px)" : "-150px"

        return (
          <motion.div
            key={flier.id}
            onClick={() => isMissile ? clickMissile() : clickWorldPigeon(letter)}
            style={{
              position: "fixed",
              top: `${flier.yPct}%`,
              left: 0,
              zIndex: isMissile ? 1 : 2,
              cursor: "pointer",
              userSelect: "none",
              // The element starts at left:0, then x-translate moves it
            }}
            initial={{ x: startX }}
            animate={{
              x: [startX, endX],
              y: isMissile ? [0, 8, -4, 0] : [0, -14, 6, -10, 0],
            }}
            transition={{
              x: {
                duration: flier.duration,
                repeat: Infinity,
                ease: "linear",
                delay: flier.delay,
                repeatDelay: 0,
              },
              y: {
                duration: isMissile ? 2.8 : 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: flier.delay,
              },
            }}
          >
            {isMissile ? (
              // Swap emoji for: <img src={missile} style={{ width: 80, transform: `scaleX(${flip})`, filter:"drop-shadow(0 2px 8px rgba(255,80,0,0.6))" }} />
              <div style={{
                fontSize: "40px",
                transform: `scaleX(${flip})`,
                filter: "drop-shadow(0 2px 10px rgba(255,100,0,0.55))",
                display: "inline-block",
                lineHeight: 1,
              }}>🚀</div>
            ) : (
              <img
                src={pigeon}
                alt=""
                style={{
                  width: "70px",
                  display: "block",
                  transform: `scaleX(${flip})`,
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
                }}
              />
            )}
          </motion.div>
        )
      })}

      {/* ── INBOUND PIGEONS: fly in and cluster at screen center ── */}
      <AnimatePresence>
        {inboundPigeons.map((p) => {
          const startX = p.fromRight ? "calc(100vw + 100px)" : "-100px"
          return (
            <motion.div
              key={p.uid}
              onClick={() => openScrollFromLetter(p.letter)}
              style={{
                position: "fixed",
                // anchor to center of screen, then offset
                top: "50%",
                left: "50%",
                zIndex: 8,
                cursor: "pointer",
              }}
              initial={{ x: startX, y: "-50%", opacity: 0 }}
              animate={{
                x: `calc(-50% + ${p.offsetX}px)`,
                y: [
                  `calc(-50% + ${p.offsetY}px)`,
                  `calc(-50% + ${p.offsetY - 14}px)`,
                  `calc(-50% + ${p.offsetY + 6}px)`,
                  `calc(-50% + ${p.offsetY - 10}px)`,
                  `calc(-50% + ${p.offsetY}px)`,
                ],
                opacity: 1,
              }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.4 } }}
              transition={{
                x: { duration: 0.9, delay: p.delay, ease: "easeOut" },
                opacity: { duration: 0.3, delay: p.delay },
                y: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: p.delay + 0.9 },
              }}
              whileHover={{ scale: 1.25 }}
            >
              <div style={{ position: "relative", textAlign: "center" }}>
                <img
                  src={pigeon}
                  alt=""
                  style={{
                    width: "90px",
                    display: "block",
                    filter: "drop-shadow(0 4px 16px rgba(255,220,80,0.8))",
                    transform: p.fromRight ? "scaleX(-1)" : "scaleX(1)",
                  }}
                />
                {/* sender name tag below pigeon */}
                <div style={{
                  marginTop: "6px",
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  color: "#f5c97a",
                  fontFamily: "'Georgia', serif",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(212,163,85,0.35)",
                }}>
                  ✉️ {p.letter.senderName}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* ── DISMISS PIGEONS hint when inbound cluster is showing ── */}
      <AnimatePresence>
        {inboundPigeons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 9,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div style={{
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
              borderRadius: "10px",
              padding: "8px 14px",
              color: "#f5c97a",
              fontFamily: "'Georgia', serif",
              fontSize: "13px",
              border: "1px solid rgba(212,163,85,0.3)",
            }}>
              🕊️ {inboundPigeons.length} pigeon{inboundPigeons.length > 1 ? "s" : ""} arrived — click to read
            </div>
            <button
              onClick={() => setInboundPigeons([])}
              style={{
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px",
                padding: "5px 12px",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "'Georgia', serif",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      <motion.button
        onClick={() => { setReading(true); setSearchEmail(""); setFoundLetters([]); setInboundPigeons([]) }}
        style={{
          position: "fixed", top: 20, left: 20,
          background: `url(${scroll}) center/cover no-repeat`,
          border: "none", cursor: "pointer",
          padding: "14px 28px",
          color: "#4b2e19",
          fontFamily: "'Georgia', serif",
          fontWeight: "bold",
          fontSize: "14px",
          minWidth: "170px",
          minHeight: "52px",
          zIndex: 10,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        read received letter
      </motion.button>

      {/* ── CENTER TOP: TITLE BANNER ── */}
      <div style={{
        position: "fixed", top: 14,
        left: "50%", transform: "translateX(-50%)",
        zIndex: 10,
      }}>
        <div style={{
          background: `url(${scroll}) center/cover no-repeat`,
          padding: "18px 60px",
          minWidth: "260px", minHeight: "70px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <h1 style={{
            margin: 0, fontSize: "42px",
            color: "#3b1f0a",
            fontFamily: "'Georgia', serif",
            fontWeight: "900", letterSpacing: "2px",
            textShadow: "1px 1px 0 rgba(255,255,255,0.3)",
            whiteSpace: "nowrap",
          }}>
            Pigeon Man
          </h1>
        </div>
      </div>

      {/* ── BOTTOM CENTER: SEND BUTTON / INPUT FLOW ── */}
      <div style={{
        position: "fixed", bottom: 36,
        left: "50%", transform: "translateX(-50%)",
        zIndex: 20, textAlign: "center",
        width: "100%", maxWidth: "520px",
        padding: "0 20px", boxSizing: "border-box",
      }}>
        <AnimatePresence mode="wait">

          {!sending && !done && (
            <motion.button
              key="send-btn"
              onClick={startSending}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{
                background: `url(${scroll}) center/cover no-repeat`,
                border: "none", cursor: "pointer",
                padding: "20px 60px",
                color: "#3b1f0a",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold", fontSize: "18px",
                minWidth: "300px", minHeight: "64px",
              }}
            >
              send a letter with pijohn
            </motion.button>
          )}

          {sending && !done && (
            <motion.div
              key="input-flow"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              style={{
                background: "rgba(0,0,0,0.58)",
                backdropFilter: "blur(14px)",
                borderRadius: "16px",
                border: "1px solid rgba(212,163,85,0.22)",
                padding: "24px 28px",
              }}
            >
              <div style={{ height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginBottom: "18px", overflow: "hidden" }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
                  style={{ height: "100%", background: "linear-gradient(90deg,#d4a355,#f5c97a)", borderRadius: "2px" }} />
              </div>

              <AnimatePresence mode="wait">
                <motion.p key={`lbl-${currentField}`}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  style={{ color: "#f5c97a", fontFamily: "'Georgia',serif", fontSize: "12px", letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 10px" }}
                >
                  {`[ ${currentField + 1} / ${FIELDS.length} ]`}
                </motion.p>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div key={`field-${currentField}`}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
                >
                  {FIELDS[currentField].type === "textarea" ? (
                    <textarea ref={inputRef} rows={4} value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)}
                      placeholder={FIELDS[currentField].placeholder}
                      onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleNext() }}
                      style={inputStyle} />
                  ) : (
                    <input ref={inputRef} type={FIELDS[currentField].type} value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)}
                      placeholder={FIELDS[currentField].placeholder}
                      onKeyDown={e => { if (e.key === "Enter") handleNext() }}
                      style={inputStyle} />
                  )}
                  <motion.button onClick={handleNext}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    style={{
                      background: "linear-gradient(135deg,#d4a355,#f5c97a)",
                      border: "none", borderRadius: "10px",
                      width: "48px", height: "48px",
                      cursor: "pointer", fontSize: "22px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#3b1f0a", fontWeight: "bold",
                    }}
                  >
                    {currentField === FIELDS.length - 1 ? "🕊️" : "→"}
                  </motion.button>
                </motion.div>
              </AnimatePresence>

              <button onClick={() => setSending(false)} style={{
                marginTop: "14px", background: "none", border: "none",
                color: "rgba(255,255,255,0.32)", fontSize: "12px",
                cursor: "pointer", fontFamily: "'Georgia',serif", letterSpacing: "1px",
              }}>
                abort mission
              </button>
            </motion.div>
          )}

          {done && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
                borderRadius: "16px", padding: "28px 40px",
                color: "#f5c97a", fontFamily: "'Georgia',serif", fontSize: "20px",
                border: "1px solid rgba(212,163,85,0.4)",
              }}
            >
              🕊️ Pigeon dispatched through enemy skies!
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── READ LETTERS MODAL ── */}
      <AnimatePresence>
        {reading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 9998, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
            onClick={e => { if (e.target === e.currentTarget) setReading(false) }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              style={{
                background: "rgba(18,10,4,0.95)",
                border: "1px solid rgba(212,163,85,0.3)",
                borderRadius: "20px", padding: "36px",
                width: "480px", maxWidth: "92vw",
                maxHeight: "80vh", overflowY: "auto",
                backdropFilter: "blur(20px)",
              }}
            >
              <h2 style={{ color: "#f5c97a", fontFamily: "'Georgia',serif", marginTop: 0, textAlign: "center" }}>
                📜 Open Your Pigeons
              </h2>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="email" placeholder="Your email address..."
                  value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && openPigeons()}
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={openPigeons} style={{
                  background: "linear-gradient(135deg,#d4a355,#f5c97a)",
                  border: "none", borderRadius: "10px",
                  padding: "0 20px", cursor: "pointer",
                  fontFamily: "'Georgia',serif", fontWeight: "bold",
                  color: "#3b1f0a", fontSize: "15px", flexShrink: 0,
                }}>
                  Search
                </button>
              </div>

              {/* no results shown here — pigeons fly to center after search */}

              <button onClick={() => setReading(false)} style={{
                marginTop: 24, width: "100%",
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", padding: "11px",
                color: "rgba(255,255,255,0.32)",
                cursor: "pointer", fontFamily: "'Georgia',serif", fontSize: "13px",
              }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCROLL / MISSILE POPUP ── */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 9999, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedMessage(null) }}
          >
            {selectedMessage.isMissile ? (
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: -3 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                style={{
                  background: "rgba(10,4,0,0.96)",
                  border: "2px solid rgba(255,80,0,0.45)",
                  borderRadius: "16px", padding: "48px 52px",
                  maxWidth: "460px", width: "90vw",
                  textAlign: "center", fontFamily: "'Georgia',serif",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 0 60px rgba(255,80,0,0.12)",
                }}
              >
                <div style={{ fontSize: "52px", marginBottom: "20px" }}>🚀</div>
                <p style={{
                  color: "#ff6a00", fontSize: "22px",
                  lineHeight: 1.65, margin: "0 0 28px",
                  textShadow: "0 0 20px rgba(255,100,0,0.35)",
                }}>
                  {selectedMessage.missileMsg}
                </p>
                <button onClick={() => setSelectedMessage(null)} style={{
                  padding: "10px 28px", borderRadius: "10px",
                  border: "1px solid rgba(255,80,0,0.4)",
                  cursor: "pointer",
                  background: "rgba(255,80,0,0.12)",
                  color: "#ff6a00",
                  fontFamily: "'Georgia',serif",
                  fontSize: "14px", letterSpacing: "1px",
                }}>
                  Understood
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{
                  backgroundImage: `url(${scroll})`,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  width: "600px", maxWidth: "92vw",
                  minHeight: "750px",
                  paddingTop: "160px", paddingLeft: "100px",
                  paddingRight: "100px", paddingBottom: "160px",
                  boxSizing: "border-box", textAlign: "center",
                  color: "#4b2e19", fontFamily: "'Georgia',serif",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "12px",
                }}
              >
                <p style={{ fontSize: "13px", fontStyle: "italic", margin: 0, opacity: 0.62 }}>
                  {selectedMessage.flavour}
                </p>
                <p style={{ fontSize: "17px", fontWeight: "bold", margin: "4px 0" }}>
                  From {selectedMessage.senderName}
                </p>
                <p style={{ fontSize: "19px", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
                  {selectedMessage.message}
                </p>
                <button onClick={() => setSelectedMessage(null)} style={{
                  marginTop: "14px", padding: "10px 28px",
                  borderRadius: "10px", border: "none",
                  cursor: "pointer", background: "#5c3b1e",
                  color: "white", fontFamily: "'Georgia',serif",
                  fontSize: "14px", letterSpacing: "1px",
                }}>
                  Release Pigeon
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(212,163,85,0.32)",
  background: "rgba(0,0,0,0.5)",
  color: "white",
  fontFamily: "'Georgia', serif",
  fontSize: "16px",
  outline: "none",
  backdropFilter: "blur(8px)",
  boxSizing: "border-box",
  resize: "none",
}