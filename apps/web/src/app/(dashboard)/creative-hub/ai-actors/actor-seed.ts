/** Demo library rows until HeyGen “list avatars” (or DB) is wired. */
export type ActorCardModel = {
  id: string
  name: string
  image: string
  tags: string[]
  gender: 'male' | 'female'
  /** 0 = light … 4 = deep (filter swatch index) */
  skinTone: number
  shootingStyle: 'selfie' | 'presenter'
  age: 'young' | 'middle' | 'senior'
  style: 'professional' | 'casual' | 'ugc'
}

export const DEMO_AI_ACTORS: ActorCardModel[] = [
  {
    id: 'demo-1',
    name: 'Pharma Sheryl',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a5?w=600&h=800&fit=crop&q=80',
    tags: ['ugc', 'studio'],
    gender: 'female',
    skinTone: 2,
    shootingStyle: 'presenter',
    age: 'middle',
    style: 'professional',
  },
  {
    id: 'demo-2',
    name: 'Dr Smith',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop&q=80',
    tags: ['studio', 'podcast'],
    gender: 'male',
    skinTone: 1,
    shootingStyle: 'presenter',
    age: 'middle',
    style: 'professional',
  },
  {
    id: 'demo-3',
    name: 'Reese — Getting ready',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&q=80',
    tags: ['ugc', 'studio'],
    gender: 'female',
    skinTone: 0,
    shootingStyle: 'selfie',
    age: 'young',
    style: 'ugc',
  },
  {
    id: 'demo-4',
    name: 'Priya — Marketing strategy',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop&q=80',
    tags: ['ugc', 'podcast'],
    gender: 'female',
    skinTone: 3,
    shootingStyle: 'presenter',
    age: 'young',
    style: 'casual',
  },
  {
    id: 'demo-5',
    name: 'Marcus — Gym',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&q=80',
    tags: ['ugc', 'studio'],
    gender: 'male',
    skinTone: 4,
    shootingStyle: 'selfie',
    age: 'young',
    style: 'ugc',
  },
  {
    id: 'demo-6',
    name: 'Elena — Clinic',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=800&fit=crop&q=80',
    tags: ['studio', 'professional'],
    gender: 'female',
    skinTone: 2,
    shootingStyle: 'presenter',
    age: 'middle',
    style: 'professional',
  },
]
