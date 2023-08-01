import View from './view.js'

export default class Info extends View {
    constructor() {
        super()

        this.html = fetch('/pages/info.html').then(response => response.text())
    }

    async getHtml() {
        return await this.html
    }
}