import Board from './board.js'
import Info from './info.js'

const info = new Info()
const board = new Board()

const router = async () => {
    const routes = [
        {
            path: "/",
            view: board
        },
        {
            path: "/info",
            view: info
        }
    ]

    const checkMatches = routes.map(route => {
        return {
            route: route,
            isMatch: location.pathname === route.path
        }
    })

    const match = checkMatches.find(match => match.isMatch)
    document.getElementById("body").innerHTML = await match.route.view.getHtml() || ""
    match.route.view.configure()

    Array.from(document.getElementById("nav-items").getElementsByTagName("li")).forEach(element => {
        element.className = "nav-item" + (element.id === match.route.path ? " selected" : "")
    })
}

const navigateTo = url => {
    history.pushState(null, null, url)
    router()
};

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault()
            navigateTo(e.target.href)
        }
    })
    router()
})

window.addEventListener('popstate', router);
