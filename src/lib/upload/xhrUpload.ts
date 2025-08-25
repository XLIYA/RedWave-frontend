import { http } from '@/lib/api/http'

export type XhrUploadOpts = {
  url: string
  formData: FormData
  withAuth?: boolean
  onProgress?: (percent: number) => void
}

export function xhrUpload({ url, formData, withAuth, onProgress }: XhrUploadOpts) {
  const xhr = new XMLHttpRequest()
  const token = withAuth ? http.getAuthToken() : null

  const promise = new Promise<Response>((resolve, reject) => {
    xhr.open('POST', url, true)
    if (withAuth && token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      resolve(new Response(xhr.responseText, { status: xhr.status }))
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })

  return { xhr, promise }
}


