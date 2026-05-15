import "./App.css"

import { useState, useEffect } from "react"

import { motion } from "framer-motion"

import emailjs from "@emailjs/browser"

import {
  collection,
  addDoc,
  getDocs
} from "firebase/firestore"

import { db } from "./firebase"

import sky from "./assets/sky.png"
import pigeon from "./assets/pigeon.png"
import scroll from "./assets/scroll.png"

export default function App() {

  const WEBSITE_URL =
    "https://pigeon-man.vercel.app"

  const [senderName, setSenderName] =
    useState("")

  const [senderEmail, setSenderEmail] =
    useState("")

  const [receiverName, setReceiverName] =
    useState("")

  const [receiverEmail, setReceiverEmail] =
    useState("")

  const [message, setMessage] =
    useState("")

  const [searchEmail, setSearchEmail] =
    useState("")

  const [foundLetters, setFoundLetters] =
    useState([])

  const [worldLetters, setWorldLetters] =
    useState([])

  const [selectedMessage, setSelectedMessage] =
    useState(null)

  useEffect(() => {

    loadWorldLetters()

  }, [])

  async function loadWorldLetters() {

    const snapshot =
      await getDocs(
        collection(db, "letters")
      )

    const letters = []

    snapshot.forEach((doc) => {

      letters.push({

        id: doc.id,

        ...doc.data()

      })

    })

    setWorldLetters(letters)

  }

  async function sendPigeon() {

    if (

      !senderName ||
      !senderEmail ||
      !receiverName ||
      !receiverEmail ||
      !message

    ) {

      alert("Fill all fields 🕊️")

      return

    }

    try {

      await addDoc(

        collection(db, "letters"),

        {

          senderName,
          senderEmail,

          receiverName,
          receiverEmail,

          message,

          createdAt: Date.now()

        }

      )

      await emailjs.send(

        "service_nkf4bj5",

        "template_yg1vy7s",

        {

          sender_name: senderName,

          receiver_name: receiverName,

          receiver_email: receiverEmail,

          pigeon_link: WEBSITE_URL

        },

        "yt1sGLx6DMWfhP3hC"

      )

      alert("🕊️ Pigeon sent successfully!")

      setSenderName("")
      setSenderEmail("")

      setReceiverName("")
      setReceiverEmail("")

      setMessage("")

      loadWorldLetters()

    }

    catch (error) {

      console.log(error)

      alert("Something went wrong")

    }

  }

  async function openPigeons() {

    const snapshot =
      await getDocs(
        collection(db, "letters")
      )

    const letters = []

    snapshot.forEach((doc) => {

      const data = doc.data()

      if (

        data.receiverEmail
          ?.toLowerCase()

        ===

        searchEmail
          .toLowerCase()

      ) {

        letters.push(data)

      }

    })

    setFoundLetters(letters)

  }

  return (

    <div

      style={{

        backgroundImage:
          `url(${sky})`,

        backgroundSize: "cover",

        backgroundPosition: "center",

        minHeight: "100vh",

        overflow: "hidden",

        position: "relative",

        paddingBottom: "100px"

      }}

    >

      <h1

        style={{

          textAlign: "center",

          color: "white",

          fontSize: "70px",

          margin: 0,

          paddingTop: "30px",

          textShadow:
            "0px 0px 20px rgba(0,0,0,0.5)"

        }}

      >

        Pigeon Man

      </h1>

      {/* WORLD PIGEONS */}

      {

        worldLetters
          .slice(0, 10)
          .map((letter, index) => (

            <motion.img

              key={index}

              src={pigeon}

              onClick={() =>

                setSelectedMessage({

                  sender:
                    letter.senderName,

                  receiver:
                    letter.receiverName,

                  message:
                    letter.message

                })

              }

              initial={{

                x:
                  Math.random() *
                  window.innerWidth,

                y:
                  100 +
                  Math.random() * 500

              }}

              animate={{

                x:
                  Math.random() *
                  window.innerWidth,

                y: [

                  100,
                  150,
                  120,
                  170,
                  100

                ],

                rotate:
                  [-5, 5, -5]

              }}

              transition={{

                duration:
                  15 +
                  Math.random() * 10,

                repeat: Infinity,

                ease: "linear"

              }}

              style={{

                width: "70px",

                position: "absolute",

                cursor: "pointer"

              }}

            />

          ))

      }

      {/* SEND BOX */}

      <div

        style={{

          width: "420px",

          margin: "30px auto",

          background:
            "rgba(255,255,255,0.2)",

          padding: "25px",

          borderRadius: "20px",

          backdropFilter: "blur(10px)",

          display: "flex",

          flexDirection: "column",

          gap: "10px"

        }}

      >

        <h2

          style={{

            color: "white",

            textAlign: "center"

          }}

        >

          Send a Pigeon 🕊️

        </h2>

        <input
          placeholder="Your Name"
          value={senderName}
          onChange={(e) =>
            setSenderName(e.target.value)
          }
        />

        <input
          placeholder="Your Email"
          value={senderEmail}
          onChange={(e) =>
            setSenderEmail(e.target.value)
          }
        />

        <input
          placeholder="Receiver Name"
          value={receiverName}
          onChange={(e) =>
            setReceiverName(e.target.value)
          }
        />

        <input
          placeholder="Receiver Email"
          value={receiverEmail}
          onChange={(e) =>
            setReceiverEmail(e.target.value)
          }
        />

        <textarea

          rows="7"

          placeholder="Write your secret letter..."

          value={message}

          onChange={(e) =>
            setMessage(e.target.value)
          }

        />

        <button

          onClick={sendPigeon}

          style={{

            padding: "12px",

            borderRadius: "10px",

            border: "none",

            cursor: "pointer",

            fontWeight: "bold"

          }}

        >

          Send Pigeon 🕊️

        </button>

      </div>

      {/* OPEN LETTERS */}

      <div

        style={{

          width: "420px",

          margin: "20px auto",

          background:
            "rgba(255,255,255,0.2)",

          padding: "25px",

          borderRadius: "20px",

          backdropFilter: "blur(10px)",

          display: "flex",

          flexDirection: "column",

          gap: "10px"

        }}

      >

        <h2

          style={{

            color: "white",

            textAlign: "center"

          }}

        >

          Open Your Pigeons 📜

        </h2>

        <input

          placeholder="Enter your email"

          value={searchEmail}

          onChange={(e) =>
            setSearchEmail(e.target.value)
          }

        />

        <button

          onClick={openPigeons}

          style={{

            padding: "12px",

            borderRadius: "10px",

            border: "none",

            cursor: "pointer",

            fontWeight: "bold"

          }}

        >

          Open Letters

        </button>

      </div>

      {/* PERSONAL LETTER PIGEONS */}

      <div

        style={{

          display: "flex",

          justifyContent: "center",

          flexWrap: "wrap",

          marginTop: "40px"

        }}

      >

        {

          foundLetters.map((letter, index) => (

            <motion.img

              key={index}

              src={pigeon}

              onClick={() =>

                setSelectedMessage({

                  sender:
                    letter.senderName,

                  receiver:
                    letter.receiverName,

                  message:
                    letter.message

                })

              }

              animate={{

                y: [0, -20, 0],

                rotate: [-5, 5, -5]

              }}

              transition={{

                duration: 2,

                repeat: Infinity

              }}

              style={{

                width: "100px",

                margin: "20px",

                cursor: "pointer"

              }}

            />

          ))

        }

      </div>

      {/* SCROLL POPUP */}

      {

        selectedMessage && (

          <div

            style={{

              position: "fixed",

              top: 0,

              left: 0,

              width: "100%",

              height: "100%",

              background:
                "rgba(0,0,0,0.5)",

              display: "flex",

              justifyContent: "center",

              alignItems: "center",

              zIndex: 9999

            }}

          >

            <div

              style={{

                backgroundImage:
                  `url(${scroll})`,

                backgroundSize:
                  "100% 100%",

                backgroundRepeat:
                  "no-repeat",

                width: "700px",

                height: "900px",

                paddingTop: "170px",

                paddingLeft: "120px",

                paddingRight: "120px",

                paddingBottom: "170px",

                boxSizing: "border-box",

                display: "flex",

                flexDirection: "column",

                justifyContent: "center",

                alignItems: "center",

                textAlign: "center",

                color: "#4b2e19",

                fontSize: "28px",

                fontFamily: "serif",

                whiteSpace: "pre-wrap"

              }}

            >

              🕊️ From {

                selectedMessage.sender

              }

              to {

                selectedMessage.receiver

              }

              <br />
              <br />

              {

                selectedMessage.message

              }

              <br />
              <br />

              <button

                onClick={() =>
                  setSelectedMessage(null)
                }

                style={{

                  padding: "10px 20px",

                  borderRadius: "10px",

                  border: "none",

                  background: "#5c3b1e",

                  color: "white",

                  cursor: "pointer"

                }}

              >

                Close

              </button>

            </div>

          </div>

        )

      }

    </div>

  )

}