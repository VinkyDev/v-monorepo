import { Clipboard } from 'bridge'
import { useState } from 'react'
import { Button } from 'ui/components'

function App() {
  const [clipboardText, setClipboardText] = useState('')

  const handleGetClipboardText = async () => {
    const result = await Clipboard.getClipboardText()
    if (result.success) {
      setClipboardText(result.data || '')
    }
  }

  return (
    <>
      <Button onClick={handleGetClipboardText}>
        Get Clipboard Text
      </Button>

      <p>
        Clipboard Text:
        {clipboardText}
      </p>
    </>
  )
}

export default App
