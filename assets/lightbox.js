import {
    enableBodyScroll,
    disableBodyScroll
} from './body-scroll-lock.js'

/**
 * @property {HTMLElement} element
 * @property {string[]} images lightbox image paths
 * @property {string} url image currently displayed
 */
class Lightbox {

    static init() {
        const links = Array.from(document.querySelectorAll('a[href$=".webp"]'))
        const gallery = links.map(link => link.getAttribute('href'))
        links.forEach(link => link.addEventListener('click', e => {
            e.preventDefault()
            new Lightbox(e.currentTarget.getAttribute('href'), gallery)
        }))
    }
    /**
     * @param {string} url image URL
     * @param {string[]} images lightbox image paths
     */
    constructor(url, images) {
        this.element = this.buildDOM(url)
        this.images = images
        this.loadImage(url)
        this.onKeyUp = this.onKeyUp.bind(this)
        document.body.appendChild(this.element)
        disableBodyScroll(this.element)
        document.addEventListener('keyup', this.onKeyUp)
    }
    /**
    * @param {string} url image URL
    */
    loadImage(url) {
        this.url = null
        const image = new Image()
        const container = this.element.querySelector('.lightbox__container')
        const loader = document.createElement('div')
        loader.classList.add('lightbox__loader')
        container.innerHTML = "" 
        container.appendChild(loader)
        image.onload = () => {
            container.removeChild(loader)
            container.appendChild(image)
            this.url = url
        }
        image.src = url
    }
    /**
     * 
     * @param {KeyboardEvent} e 
     */
    onKeyUp (e) {
        if(e.key === "Escape" || e.key === "Esc") {
            this.close(e)
        } else if(e.key === "ArrowLeft" || e.key === "Left") {
            this.prev(e)
        }
        if(e.key === "ArrowRight" || e.key === "Right") {
            this.next(e)
        }
    }
    /**
     * To close the lightbox
     * @param {MouseEvent|KeyboardEvent} e 
     */
    close (e) {
        e.preventDefault()
        this.element.classList.add('fadeOut')
        enableBodyScroll(this.element)
        window.setTimeout(() => {
            this.element.parentElement.removeChild(this.element)
        }, 500)
        document.removeEventListener('keyup', this.onKeyUp)
    }
/**
     * To move next in the lightbox
     * @param {MouseEvent|KeyboardEvent} e 
     */
next(e) {
    e.preventDefault();
    let i = this.images.findIndex(image => image === this.url);
    for (let j = i + 1; j < this.images.length; j++) {
        if (!this.isImageHidden(this.images[j])) {
            this.loadImage(this.images[j]);
            return;
        }
    }
 
    for (let j = 0; j <= i; j++) {
        if (!this.isImageHidden(this.images[j])) {
            this.loadImage(this.images[j]);
            return;
        }
    }
}

prev(e) {
    e.preventDefault();
    let i = this.images.findIndex(image => image === this.url);
    for (let j = i - 1; j >= 0; j--) {
        if (!this.isImageHidden(this.images[j])) {
            this.loadImage(this.images[j]);
            return;
        }
    }
    
    for (let j = this.images.length - 1; j >= i; j--) {
        if (!this.isImageHidden(this.images[j])) {
            this.loadImage(this.images[j]);
            return;
        }
    }
}

isImageHidden(url) {
    return document.querySelector(`a[href="${url}"]`).classList.contains('element--hidden');
}
    /**
         * @param {string} url image URL
         * @returns {HTMLElement}
         */
    buildDOM(url) {
        const dom = document.createElement('div')
        dom.classList.add('lightbox')
        dom.innerHTML = `<button class="lightbox__close">Fermer</button>
		<button class="lightbox__next">Suivant</button>
		<button class="lightbox__prev">Précédent</button>
		<div class="lightbox__container"></div>`
        dom.querySelector('.lightbox__close').addEventListener('click', this.close.bind(this))
        dom.querySelector('.lightbox__next').addEventListener('click', this.next.bind(this))
        dom.querySelector('.lightbox__prev').addEventListener('click', this.prev.bind(this))
        
        return dom
    }
}

const buttons = document.querySelectorAll('.filter button');
const elements = document.querySelectorAll('.element');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(button => button.classList.remove('active'));
    button.classList.add('active');
    const filter = button.getAttribute('data-filter');

    elements.forEach(element => {
      if (filter === 'all' || element.classList.contains(filter)) {
        element.classList.remove('element--hidden');
      } else {
        element.classList.add('element--hidden');
      }
    });
  });
});


Lightbox.init()