if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./serviceworker.js')
}

import Board from './board.js'
import Info from './info.js'

const info = new Info()
const board = new Board()

const router = async (from) => {
    const routes = [
        {
            path: '/',
            view: board,
            index: 0,
        },
        {
            path: '/info',
            view: info,
            index: 1,
        },
    ]

    const match = routes.find(route => route.path === location.pathname)

    const delayMs = 200 
    const step = match.index - routes.find(route => route.path === from)?.index

    const body = document.getElementById('body')
    body.style.animation = 'unset'
    body.offsetHeight

    if (step !== 0) {
        body.style.animation = `${step > 0 ? 'middle-to-left' : 'middle-to-right'} ${delayMs}ms ease-in-out`
        await new Promise(r => setTimeout(r, delayMs))
    }

    body.innerHTML = await match.view.getHtml() || ''
    match.view.configure()

    Array.from(document.getElementById('nav-items').getElementsByTagName('li')).forEach(element => {
        element.className = 'nav-item' + (element.id === match.path ? ' selected' : '')
    })

    if (step !== 0) {
        body.style.animation = `${step < 0 ? 'middle-to-left' : 'middle-to-right'} reverse ${delayMs}ms ease-in-out`
        await new Promise(r => setTimeout(r, delayMs))
    }
}

const navigateTo = (url) => {
    let from = location.pathname
    history.pushState(null, null, url)
    router(from)
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault()
            navigateTo(e.target.href)
        }
    })
    router(location.pathname)
})

window.addEventListener('popstate', router);

const setCookie = async (name, json, period) => {
    document.cookie = `${name}=${JSON.stringify(json)}; path=/; expires=${new Date(Date.now() + 1000 * 3600 * 24 * period).toUTCString()}; SameSite=Strict`
}

const getCookie = async (name) => {
    if (document.cookie) {
        for (let data of document.cookie.split(';')) {
            data = data.trim().split('=')
            if (data[0] === name) return JSON.parse(data[1])
        }
    }
    return null
}

let cookieBoard = await getCookie('board')
if (cookieBoard !== null) {
    board.board = await getCookie('board')
    board.solution = await getCookie('solution')
}
window.addEventListener('beforeunload', _ => {
    setCookie('board', board.board, 7)
    setCookie('solution', board.solution, 7)
})
