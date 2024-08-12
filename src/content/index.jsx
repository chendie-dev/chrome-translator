/*global chrome*/
import { SearchOutlined } from '@ant-design/icons'
import { Button, Card, Spin } from 'antd'
import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'

function Content() {
  const [isShow, setIsShow] = useState({
    showButton: false,
    showPopover: false,
  })

  const [mouseLocation, setMouseLocation] = useState({ x: 0, y: 0 })
  //输出内容
  const [text, setText] = useState('')
  //选中内容
  const [selectedText, setSelectedText] = useState('')
  const buttonRef = useRef()
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const port = chrome.runtime.connect({ name: 'streamData' })
  useEffect(() => {
    const widthSize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', widthSize)
    return () => {
      window.removeEventListener('resize', widthSize)
    }
  }, [])
  useEffect(() => {
    const callBack = (event) => {
      const selectedText = window.getSelection().toString()
      if (selectedText.length > 0) {
        setSelectedText(selectedText)
        setMouseLocation({ x: event.x, y: event.y })
        setIsShow((val) => ({ ...val, showButton: true }))
        buttonRef.current = setTimeout(() => {
          setIsShow((val) => ({ ...val, showButton: false }))
        }, 5000)
      }
    }
    document.addEventListener('mouseup', callBack)
    return () => {
      document.removeEventListener('mouseup', callBack)
    }
  }, [])

  return (
    <>
      <Button
        type="dashed"
        shape="circle"
        icon={<SearchOutlined style={{ color: 'red', fontSize: 18 }} />}
        style={{
          display: isShow.showButton ? 'block' : 'none',
          position: 'fixed',
          top: mouseLocation.y - 30,
          left: mouseLocation.x,
          zIndex: 9999,
        }}
        onMouseEnter={() => {
          port.postMessage({ type: 'translate', text: selectedText })
          port.onMessage.addListener((data) => {
            if (data.done) {
              port.disconnect()
              return
            }
            setText(data?.translatedText)
          })
          clearTimeout(buttonRef.current)
          setIsShow((val) => ({ ...val, showPopover: true }))
        }}
        onMouseLeave={() => {
          setIsShow((val) => ({ ...val, showButton: false }))
        }}
      ></Button>
      <Card
        style={{
          position: 'fixed',
          display: isShow.showPopover ? 'block' : 'none',
          maxWidth: 500,
          top: mouseLocation.y - 30,
          left:
            mouseLocation.x + 500 > windowWidth
              ? mouseLocation.x - 500
              : mouseLocation.x + 50,
          zIndex: 9999,
          boxShadow: '4px 6px 30px rgba(0, 0, 0, 0.3)',
        }}
        onMouseLeave={() => {
          setIsShow((val) => ({ ...val, showPopover: false }))
          setText('')
        }}
      >
        {text.length === 0 ? <Spin /> : <p style={{ margin: 0 }}>{text}</p>}
      </Card>
    </>
  )
}

const app = document.createElement('div')
app.id = 'CRX-container'
document.body.appendChild(app)
const crxContainer = ReactDOM.createRoot(
  document.getElementById('CRX-container')
)
crxContainer.render(<Content />)
