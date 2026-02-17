/**
 * Inactivity Timeout Utility
 * Auto-logout users after 30 minutes of inactivity
 */

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000 // Show warning 5 minutes before logout

export class InactivityTimer {
  private timeout: NodeJS.Timeout | null = null
  private warningTimeout: NodeJS.Timeout | null = null
  private onWarning: (() => void) | null = null
  private onLogout: (() => void) | null = null

  constructor(onWarning?: () => void, onLogout?: () => void) {
    this.onWarning = onWarning || null
    this.onLogout = onLogout || null
  }

  start() {
    this.reset()
    this.setupEventListeners()
  }

  stop() {
    this.clearTimeouts()
    this.removeEventListeners()
  }

  reset() {
    this.clearTimeouts()

    // Set warning timeout (25 minutes)
    this.warningTimeout = setTimeout(() => {
      if (this.onWarning) {
        this.onWarning()
      }
    }, INACTIVITY_TIMEOUT - WARNING_TIME)

    // Set logout timeout (30 minutes)
    this.timeout = setTimeout(() => {
      if (this.onLogout) {
        this.onLogout()
      }
    }, INACTIVITY_TIMEOUT)
  }

  private clearTimeouts() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout)
      this.warningTimeout = null
    }
  }

  private handleActivity = () => {
    this.reset()
  }

  private setupEventListeners() {
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, true)
    })
  }

  private removeEventListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true)
    })
  }
}
