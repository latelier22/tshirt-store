'use client'
import { proxy } from 'valtio'

export const state = proxy({
  intro: true,
  colors: ['#ccc', '#EFBD4E', '#80C670', '#726DE8', '#EF674E', '#353934'],
  decals: ['logo-fond-sombre', 'logo-fond-clair', 'logo-fond-moyen'],
  color: '#353934',
  decal: 'logo-fond-sombre',
})
