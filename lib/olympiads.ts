import type { Olympiad, OlympiadResult, User } from './types'

export type ParticipantStatus = 'registered' | 'playing' | 'finished' | 'left'

export interface ParticipantRow {
  user: User
  registeredAt: string
  status: ParticipantStatus
}

export const olympiadParticipants = (olympiad: Olympiad, users: User[]): ParticipantRow[] => {
  const total = Math.min(olympiad.registered, users.length)
  const start = new Date(olympiad.createdAt).getTime()
  return users.slice(0, total).map((user, index) => {
    const playingEnd = olympiad.playing
    const finishedEnd = playingEnd + olympiad.finished
    const leftEnd = finishedEnd + olympiad.left
    const status: ParticipantStatus =
      index < playingEnd ? 'playing' : index < finishedEnd ? 'finished' : index < leftEnd ? 'left' : 'registered'
    return {
      user,
      registeredAt: new Date(start + (index + 1) * 9 * 60_000).toISOString(),
      status,
    }
  })
}

export const olympiadResultsFor = (olympiad: Olympiad, users: User[]): OlympiadResult[] => {
  if (olympiad.results.length > 0) {
    return [...olympiad.results].sort((left, right) => right.score - left.score || left.timeSeconds - right.timeSeconds)
  }
  const total = olympiad.questionIds.length || 30
  const count = olympiad.status === 'live' ? olympiad.finished : Math.min(olympiad.registered, 120)
  if (count === 0) return []
  return users
    .slice(0, count)
    .map((user, index) => ({
      userId: user.id,
      name: user.name,
      score: Math.max(3, total - 2 - Math.round(Math.sqrt(index) * 1.35)),
      total,
      timeSeconds: 2_100 + ((index * 37) % 3_200),
      region: user.region,
    }))
    .sort((left, right) => right.score - left.score || left.timeSeconds - right.timeSeconds)
}

export const shortName = (name: string): string => {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length < 2) return name
  return `${parts[0]} ${parts[1][0]}.`
}

export const participantStatusLabel: Record<ParticipantStatus, string> = {
  registered: "RO'YXATDAN O'TGAN",
  playing: 'QATNASHDI',
  finished: 'TUGATDI',
  left: 'TUGATLMADI',
}
