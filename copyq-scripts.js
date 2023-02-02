{

  // [Command]
  // Name = Clipboard Notification
  // Command = "
  function clipboardNotification(owns, hidden) {
    const id = isClipboard() ? 'clipboard' : 'selection'
    const icon = isClipboard() ? '\uf0ea' : '\uf246'
    const owner = owns ? 'CopyQ' : str(data(mimeWindowTitle))

    const cur = data(mimeText)
    const title = id + ' - ' + owner
    const message = hidden ? '<HIDDEN>' : cur.left(100)
    notification(
      '.id', id,
      '.title', title,
      '.message', message,
      '.icon', icon,
      '.time', 5000
    )
  }
  const onClipboardChanged_ = onClipboardChanged
  onClipboardChanged = function () {
    clipboardNotification(false, false)
    onClipboardChanged_()
  }
  const onOwnClipboardChanged_ = onOwnClipboardChanged
  onOwnClipboardChanged = function () {
    clipboardNotification(true, false)
    onOwnClipboardChanged_()
  }
  const onHiddenClipboardChanged_ = onHiddenClipboardChanged
  onHiddenClipboardChanged = function () {
    clipboardNotification(true, true)
    onHiddenClipboardChanged_()
  }
  // "
  // IsScript = true
  // Icon =\xf075

}

{

  // [Command]
  // Name=Store Copy Time
  // Command="
  copyq:
  const time = dateString('yyyy-MM-dd hh:mm:ss')
  setData('application/x-copyq-user-copy-time', time)
  const tagsMime = 'application/x-copyq-tags'
  const tags = str(data(tagsMime)) + ', ' + time
  setData(tagsMime, tags)
  // "
  // Automatic=true
  // Icon=\xf017

}

{

  // [Command]
  // Name = Store Window Title
  // Command = "
  copyq:
  const window = str(data(mimeWindowTitle))
  const tagsMime = 'application/x-copyq-tags'
  const tags = str(data(tagsMime)) + ', ' + window
  setData(tagsMime, tags)
  // "
  // Automatic = true
  // Icon =\xf009

}

{

  // [Command]
  // Name = Image Tab
  // Command = "
  copyq:
  const imageTab = '&Images';
  function startsWith(text, what) {
    return what === text.substring(0, what.length)
  }
  function hasImageFormat(formats) {
    for (const format of formats.values()) {
      if (startsWith(format, 'image/'))
        return true;
    }
    return false;
  }
  const formats = dataFormats();
  if (hasImageFormat(formats)) {
    // setData(mimeOutputTab, imageTab);
    const it = {}
    for (format of formats.values()) {
      it[format] = data(format)
    }
    tab(imageTab)
    add(it)
  }
  // "
  // Automatic = true
  // Icon =\xf302

}

{

  // [Command]
  // Name=URLs with Title and Icon
  // Match=^https?://
  // Command="
  copyq:
  const tabName = '&URLs';
  function lower(data) {
    return str(data).toLowerCase()
  }
  function findHeader(reply, headerName) {
    reply.data  // fetches data and headers
    const headers = reply.headers
    for (const i in headers) {
      const header = headers[i]
      if (lower(header[0]) === headerName)
        return header[1]
    }
    return ''
  }
  function fetchContent(url, maxRedirects) {
    if (maxRedirects === undefined)
      maxRedirects = 4
    serverLog('Fetching: ' + url)
    const reply = networkGet(url)
    if (maxRedirects == 0)
      return reply
    const header = findHeader(reply, 'location')
    if (header)
      return fetchContent(header, maxRedirects - 1)
    return reply
  }
  function decodeHtml(html) {
    return html.replace(/&#(\\d+);/g, function (match, charCode) {
      return String.fromCharCode(charCode);
    });
  }
  function isHtml(reply) {
    const headers = reply.headers
    for (const i in headers) {
      const header = headers[i]
      if (lower(header[0]) === 'content-type')
        return lower(header[1]).indexOf(mimeHtml) === 0
    }
    return false
  }
  function grep(content, re) {
    return content ? (re.exec(content) || [])[1] : ''
  }
  function getTitle(content) {
    const title = grep(content, /<title[^>]*>([^<]*)<\/title>/i)
        return title ? decodeHtml(title.trim()) : ''
  }
  function getFavicon(content) {
    const iconLine = grep(content, /<link([^>]*rel=[\"'](?:shortcut )?icon[\"'][^>]*)/i)
    const icon = grep(iconLine, /href=[\"']([^\"']*)/i)
    if (!icon)
      return ''
    // Icon path can be complete URL.
    if (icon.indexOf('://') != -1)
      return fetchContent(icon).data
    // Icon path can be missing protocol.
    if (icon.substr(0, 2) === '//') {
      const i = url.search(/\/\//)
          const protocol = (i == -1) ? 'http:' : url.substr(0, i)
      return fetchContent(protocol + icon).data
    }
    // Icon path can be relative to host URL.
    if (icon[0] === '/') {
      const baseUrl = url.substr(0, url.search(/[^\/:](\/ | $) /) + 1)
      return fetchContent(baseUrl + icon).data
    }
    // Icon path can be relative to current URL.
    const baseUrl = url.substr(0, url.lastIndexOf('/') + 1)
    return fetchContent(baseUrl + icon).data
  }

  const url = str(input()).trim()
  serverLog('Fetching icon and title: ' + url)
  // URL already added? (Just check the top of the list.)
  if (url == str(read(0)))
    abort()
  // Fetch HTML.
  const reply = fetchContent(url)
  if (!isHtml(reply))
    abort()
  const content = str(reply.data)
  const title = getTitle(content)
  const icon = getFavicon(content)
   setData(mimeText, url)
  setData(mimeItemNotes, title || '')
  setData(mimeIcon, icon)
  // setData(mimeOutputTab, tabName)

  const cloned = {}
  const formats = dataFormats()
  for (const format of formats.values()) {
    cloned[format] = data(format)
  }
  tab(tabName)
  add(cloned)
  // "
  // Input=text/plain
  // Automatic=true
  // Icon=\xf0c1

}
