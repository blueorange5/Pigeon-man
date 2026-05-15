import sky from "./assets/sky.png"
import pigeon from "./assets/pigeon.png"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import { db } from "./firebase"

import {
  collection,
  addDoc,
  getDocs
} from "firebase/firestore"

import emailjs from "@emailjs/browser"

export default function App() {

  const WEBSITE_URL =
    "https://pigeon-man.vercel.app"

  const [senderName, setSenderName] = useState("")
  const [senderEmail, setSenderEmail] = useState("")

  const [receiverName, setReceiverName] = useState("")
  const [receiverEmail, setReceiverEmail] = useState("")

  const [message, setMessage] = useState("")

  const [searchEmail, setSearchEmail] = useState("")

  const [foundLetters, setFoundLetters] = useState([])

  const [selectedMessage, setSelectedMessage] =
    useState("")

  const [worldLetters, setWorldLetters] =
    useState([])

  useEffect(() => {

    loadWorldLetters()

  }, [])

  async function loadWorldLetters() {

    const snapshot =
      await getDocs(collection(db, "letters"))

    const letters = []

    snapshot.forEach((doc) => {

      letters.push(doc.data())

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

      await addDoc(collection(db, "letters"), {

        senderName,
        senderEmail,

        receiverName,
        receiverEmail,

        message,

        createdAt: Date.now()

      })

      await emailjs.send(

        "service_nkf4bj5",

        "template_yg1vy7s",

        {

          sender_name: senderName,

          receiver_name: receiverName,

          receiver_email: receiverEmail,

          website_url: WEBSITE_URL

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

    } catch (error) {

      console.log(error)

      alert("Something went wrong")

    }

  }

  async function openPigeons() {

    const snapshot =
      await getDocs(collection(db, "letters"))

    const letters = []

    snapshot.forEach((doc) => {

      const data = doc.data()

      if (

        data.receiverEmail
          .toLowerCase() ===

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

        backgroundImage: `url(${sky})`,

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

          paddingTop: "30px"

        }}

      >

        Pigeon Man

      </h1>

      {

        worldLetters
          .slice(0, 10)
          .map((letter, index) => {

            const startX =
              Math.random() *
              window.innerWidth

            const endX =
              Math.random() *
              window.innerWidth

            const startY =
              100 +
              Math.random() * 500

            return (

              <motion.img

                key={index}

                src={pigeon}

                onClick={() =>

                  setSelectedMessage(

                    `🕊️ From ${letter.senderName} to ${letter.receiverName}\n\n${letter.message}`

                  )

                }

                initial={{

                  x: startX,

                  y: startY,

                  rotate: 0

                }}

                animate={{

                  x: endX,

                  y: [

                    startY,

                    startY - 40,

                    startY + 20,

                    startY - 30,

                    startY

                  ],

                  rotate: [-5, 5, -5]

                }}

                transition={{

                  duration:
                    12 + Math.random() * 10,

                  repeat: Infinity,

                  ease: "linear"

                }}

                style={{

                  width: "70px",

                  position: "absolute",

                  cursor: "pointer"

                }}

              />

            )

          })

      }

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

          placeholder="Write your letter..."

          rows="7"

          value={message}

          onChange={(e) =>
            setMessage(e.target.value)
          }

        />

        <button onClick={sendPigeon}>

          Send Pigeon 🕊️

        </button>

      </div>

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

        <button onClick={openPigeons}>

          Open Letters

        </button>

      </div>

      {

        foundLetters.map((letter, index) => (

          <motion.img

            key={index}

            src={pigeon}

            onClick={() =>

              setSelectedMessage(

                `🕊️ From ${letter.senderName} to ${letter.receiverName}\n\n${letter.message}`

              )

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

              width: "90px",

              margin: "20px",

              cursor: "pointer"

            }}

          />

        ))

      }

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

              zIndex: 999

            }}

          >

            <div

              style={{

                background: "#f5deb3",

                padding: "30px",

                borderRadius: "20px",

                width: "400px",

                whiteSpace: "pre-wrap",

                fontSize: "20px"

              }}

            >

              {selectedMessage}

              <br />

              <br />

              <button

                onClick={() =>
                  setSelectedMessage("")
                }

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