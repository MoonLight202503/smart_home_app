import { supabase } from './supabase'

export function subscribeCommand(onUpdate) {
  return supabase
    .channel('control-command')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'control_command',
      },
      (payload) => {
        onUpdate(payload.new)
      }
    )
    .subscribe()
}