export default class View {
    constructor() {
        this.html = Promise<String>('<h1>Hello, World!</h1>')
    }

    async getHtml() {
        return this.html
    }

    async configure() {
        
    }
}