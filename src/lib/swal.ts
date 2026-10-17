import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

/** All toasts appear top-right via SweetAlert2. */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  customClass: {
    popup: 'maa-swal-toast',
  },
  didOpen: (popup) => {
    popup.addEventListener('mouseenter', Swal.stopTimer)
    popup.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export function showToast(message: string, icon: ToastKind = 'info') {
  void Toast.fire({
    icon,
    title: message,
  })
}

export function toastSuccess(message: string) {
  showToast(message, 'success')
}

export function toastError(message: string) {
  showToast(message, 'error')
}

export function toastInfo(message: string) {
  showToast(message, 'info')
}

export function toastWarning(message: string) {
  showToast(message, 'warning')
}

export interface ConfirmOptions {
  title?: string
  text?: string
  confirmText?: string
  cancelText?: string
  icon?: 'warning' | 'question' | 'info' | 'error' | 'success'
  danger?: boolean
}

/** SweetAlert2 confirm dialog (not a toast). */
export async function confirmAction(options: ConfirmOptions = {}): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title ?? 'Are you sure?',
    text: options.text,
    icon: options.icon ?? 'question',
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: options.confirmText ?? 'Yes',
    cancelButtonText: options.cancelText ?? 'Cancel',
    reverseButtons: true,
    customClass: {
      popup: 'maa-swal-confirm',
      confirmButton: options.danger
        ? 'maa-swal-btn maa-swal-btn--danger'
        : 'maa-swal-btn maa-swal-btn--primary',
      cancelButton: 'maa-swal-btn maa-swal-btn--ghost',
    },
    buttonsStyling: false,
  })
  return result.isConfirmed
}

export { Swal }
