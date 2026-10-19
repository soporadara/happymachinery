type SocialShareButtonsProps = {
  url: string
  title: string
  image?: string
}

const openShareWindow = (url: string) => {
  window.open(url, '_blank', 'width=720,height=620,noopener,noreferrer')
}

export default function SocialShareButtons({ url, title, image = '' }: SocialShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const copyAndOpen = (destination: string) => {
    void navigator.clipboard.writeText(`${title}\n${url}`).catch(() => undefined)
    window.open(destination, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button className="share-btn facebook" onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} title="Share on Facebook" aria-label="Share on Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.436H7.078v-3.491h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.885v2.264h3.328l-.532 3.491h-2.796V24C19.612 23.093 24 18.099 24 12.073z"/></svg>
      </button>
      <button className="share-btn youtube" onClick={() => copyAndOpen('https://www.youtube.com/')} title="Copy link and open YouTube" aria-label="Copy link and open YouTube">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
      </button>
      <button className="share-btn pinterest" onClick={() => openShareWindow(`https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(image)}&description=${encodedTitle}`)} title="Share on Pinterest" aria-label="Share on Pinterest">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-1.86-.02-4.1.47-6.2l1.54-6.54s-.39-.78-.39-1.94c0-1.82 1.06-3.18 2.37-3.18 1.12 0 1.66.84 1.66 1.85 0 1.13-.72 2.8-1.09 4.36-.31 1.3.65 2.36 1.94 2.36 2.33 0 4.12-2.46 4.12-6 0-3.14-2.26-5.34-5.48-5.34-3.73 0-5.92 2.8-5.92 5.69 0 1.13.43 2.34.98 3 .1.13.12.24.09.37l-.37 1.52c-.06.25-.2.3-.46.18-1.71-.8-2.78-3.3-2.78-5.31 0-4.33 3.15-8.3 9.07-8.3 4.76 0 8.46 3.39 8.46 7.92 0 4.73-2.98 8.54-7.12 8.54-1.39 0-2.69-.72-3.14-1.58l-.85 3.25c-.31 1.19-1.15 2.68-1.71 3.59.99.31 2.03.48 3.11.48A12 12 0 0 0 12 0z"/></svg>
      </button>
      <button className="share-btn twitter" onClick={() => openShareWindow(`https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`)} title="Share on X" aria-label="Share on X">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
      <button className="share-btn reddit" onClick={() => openShareWindow(`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`)} title="Share on Reddit" aria-label="Share on Reddit">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12a2.8 2.8 0 0 0-4.77-2 13.5 13.5 0 0 0-6.52-2.08l1.1-5.16 3.58.76a2 2 0 1 0 .22-1.06l-4.1-.87a.54.54 0 0 0-.64.42l-1.25 5.88A13.7 13.7 0 0 0 4.74 10 2.8 2.8 0 1 0-1.33 2.48A5.4 5.4 0 0 0 0 15c0 3.94 5.37 7.13 12 7.13S24 18.94 24 15a5.3 5.3 0 0 0-1.34-3.51A2.8 2.8 0 0 0 24 12zM7 13.8a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0zm9.7 4.55c-1.31 1.31-3.81 1.42-4.7 1.42-.88 0-3.38-.11-4.69-1.42a.54.54 0 0 1 .76-.76c.83.83 2.62 1.1 3.93 1.1s3.1-.27 3.93-1.1a.54.54 0 0 1 .76.76zm-1.45-2.8a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z"/></svg>
      </button>
      <button className="share-btn instagram" onClick={() => copyAndOpen('https://www.instagram.com/')} title="Copy link and open Instagram" aria-label="Copy link and open Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 0h10a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H7a7 7 0 0 1-7-7V7a7 7 0 0 1 7-7zm0 2.4A4.6 4.6 0 0 0 2.4 7v10A4.6 4.6 0 0 0 7 21.6h10a4.6 4.6 0 0 0 4.6-4.6V7A4.6 4.6 0 0 0 17 2.4H7zm10.5 1.8a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM12 5.8A6.2 6.2 0 1 1 12 18.2 6.2 6.2 0 0 1 12 5.8zm0 2.4a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z"/></svg>
      </button>
      <button className="share-btn tumblr" onClick={() => openShareWindow(`https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodedUrl}&title=${encodedTitle}`)} title="Share on Tumblr" aria-label="Share on Tumblr">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 24c-5.2 0-7.2-3.8-7.2-6.5V10H5V6.9c3.6-1.3 4.5-4.5 4.7-6.3h3.2v5.8h4.8V10h-4.8v6.5c0 2 .9 2.7 2.3 2.7.9 0 1.8-.3 2.3-.6l1.2 3.5c-1 .8-2.6 1.9-4.1 1.9z"/></svg>
      </button>
    </>
  )
}
