export const PERMISSIONS = {
  restaurant: {
    admin:     ['overview','orders','offline','discounts','inventory','finances','social','settings'],
    associate: ['overview','orders','offline','inventory','social'],
    viewer:    ['overview'],
  },
  salon: {
    admin:     ['overview','appointments','clients','services','inventory','finances','social','settings'],
    associate: ['overview','appointments','clients','services'],
    viewer:    ['overview'],
  },
  sports: {
    admin:     ['overview','students','attendance','fees','performance','finances','social','settings'],
    associate: ['overview','students','attendance','fees'],
    viewer:    ['overview'],
  },
  agency: {
    admin:     ['overview','clients','campaigns','leads','content','analytics','finances','settings'],
    associate: ['overview','clients','campaigns','leads','content'],
    viewer:    ['overview','campaigns'],
  },
}

export const canAccess = (role, niche, page) =>
  (PERMISSIONS[niche]?.[role] || []).includes(page)