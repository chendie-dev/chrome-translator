/*global chrome*/
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.type === 'translate') {
      const apiUrl = 'https://api.openai-hk.com/v1/chat/completions'
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Bearer hk-sdhun31000039691bc7134366ed1115b9a508c428b23937f',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          stream: true,
          messages: [
            {
              role: 'system',
              content:
                'Translate into Chinese in any language, No explanation required',
            },
            {
              role: 'user',
              content: msg?.text,
            },
          ],
        }),
      })
        .then(async (response) => {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let output = ''
          while (true) {
            const { done, value } = await reader.read()
            let decodedText = decoder?.decode(value).slice(5).split('data:')
            let dataArr = []
            decodedText?.forEach((el) => {
              try {
                dataArr.push(JSON.parse(el))
              } catch (error) {}
            })
            let content = dataArr?.reduce(
              (res, el) => res + (el.choices[0].delta?.content ?? ''),
              ''
            )
            output += content
            port.postMessage({ translatedText: output, done })
            if (done) {
              break
            }
          }
        })
        .catch((error) => {
          console.error('Error:', error)
        })
    }
  })
  port.onDisconnect.addListener(() => {
    console.log('close!')
  })
})
