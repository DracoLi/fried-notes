import Document from './app/document';
import './main.scss';

const blankDocument = new Document();
const container = document.getElementById('documentContainer');
container.insertAdjacentHTML('afterbegin', blankDocument.getHtml());
