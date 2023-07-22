import View from './view.js'

export default class Info extends View {
    constructor() {
        super()
    }

    async getHtml() {
        const response = await fetch("/pages/info.html")
        const data = await response.text()

        return data
    }

    async configure() {

    }
}