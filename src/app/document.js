import cheerio from 'cheerio'

export default class Document {

  constructor(options) {
    this.$ = cheerio.load('<div id="document"></div>');
    window.$ = this.$;
    this.$('#document').attr('contenteditable', true);
    this.appendDefaultNewLine();
  }

  appendDefaultNewLine() {
    this.$('#document').append('<p class="paragraph"><br/></p>');
  }

  getText() {
    return this.$.text();
  }

  getHtml() {
    return this.$.html();
  }
}
