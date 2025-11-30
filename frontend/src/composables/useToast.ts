import { ref } from 'vue'

export interface ToastProps {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
}

interface Toast extends Omit<ToastProps, 'id'> {
    id?: string
}

const toasts = ref<ToastProps[]>([])
let toastId = 0

export function useToast() {
    const addToast = (toast: Toast) => {
        const id = toast.id || `toast-${++toastId}`
        toasts.value.push({
            ...toast,
            id,
        } as ToastProps)
        return id
    }

    const removeToast = (id: string) => {
        const index = toasts.value.findIndex((t: ToastProps) => t.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    const success = (message: string, duration?: number) => {
        return addToast({ type: 'success', message, duration })
    }

    const error = (message: string, duration?: number) => {
        return addToast({ type: 'error', message, duration })
    }

    const warning = (message: string, duration?: number) => {
        return addToast({ type: 'warning', message, duration })
    }

    const info = (message: string, duration?: number) => {
        return addToast({ type: 'info', message, duration })
    }

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    }
}
