import React, { useState } from 'react'
import { Copy, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface SharingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SharingModal({ isOpen, onClose }: SharingModalProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('')
    const shareUrl = 'https://example.com/share/abc123' // Замініть на ваше реальне посилання для шерінгу

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
            .then(() => toast.success(t('notifications.linkCopied')))
            .catch(err => {
                console.error(t('errors.copyError'), err)
                toast.error(t('errors.failedToCopyLink'))
            })
    }

    const sendInvite = (e: React.FormEvent) => {
        e.preventDefault()
        // Тут має бути реалізована логіка відправки запрошення
        console.log(t('logs.inviteSent', { email }))
        toast.success(t('notifications.inviteSent', { email }))
        setEmail('')
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
                <h2 className="text-lg font-semibold mb-4">{t('sharing.title')}</h2>
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                    onClick={onClose}
                    aria-label={t('actions.close')}
                >
                    &times;
                </button>
                <div className="flex flex-col items-center space-y-4">
                    {/* Зображення QR-коду */}
                    <div className="w-[200px] h-[200px] flex items-center justify-center rounded-lg overflow-hidden">
                        <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/QR_code_for_mobile_English_Wikipedia.svg-0yU9CEU9LWBal5IKYn0oKaVRhv9SiW.png"
                            alt={t('sharing.qrCodeAlt')}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex w-full space-x-2">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t('sharing.shareLink')}
                        />
                        <button
                            onClick={copyToClipboard}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t('actions.copyLink')}
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={sendInvite} className="flex w-full space-x-2">
                        <input
                            type="email"
                            placeholder={t('sharing.enterEmail')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <Send className="h-4 w-4 mr-2 inline" />
                            {t('sharing.invite')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

