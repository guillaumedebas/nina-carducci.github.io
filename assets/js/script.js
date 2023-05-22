/* Carousel */
/**
 *  To add touch navigation to the carousel
 */
class CarouselTouchPlugin {
    /**
     *
     * @param {Carousel} carousel 
     */
    constructor(carousel) {
        carousel.container.addEventListener('dragstart', e => e.preventDefault())
        carousel.container.addEventListener('mousedown', this.startDrag.bind(this))
        carousel.container.addEventListener('touchstart', this.startDrag.bind(this))
        window.addEventListener('mousemove', this.drag.bind(this))
        window.addEventListener('touchmove', this.drag.bind(this))
        window.addEventListener('touchend', this.endDrag.bind(this))
        window.addEventListener('mouseup', this.endDrag.bind(this))
        window.addEventListener('touchcancel', this.endDrag.bind(this))
        this.carousel = carousel
    }
    /**
     * To start moving by touch
     * @param {MouseEvent | TouchEvent} e 
     */
    startDrag(e) {
        if (e.touches) {
            if (e.touches.length > 1) {
                return
            } else {
                e = e.touches[0]
            }
        }
        this.origin = { x: e.screenX, y: e.screenY }
        this.width = this.carousel.containerWitdth
        this.carousel.disableTransition()
    }
    /**
     * To start moving
     * @param {MouseEvent | TouchEvent} e 
     */
    drag(e) {
        if (this.origin) {
            let point = e.touches ? e.touches[0] : e
            let translate = { x: point.screenX - this.origin.x, y: point.screenY - this.origin.y }
            if(e.touches && Math.abs(translate.x) > Math.abs(translate.y)) {
                e.preventDefault()
                e.stopPropagation()
            } 
            let baseTranslate = this.carousel.currentItem * -100 / this.carousel.items.length
            this.lastTranslate = translate
            this.carousel.translate(baseTranslate + 100 * translate.x / this.width)
        }
    }
    /**
    * To end moving
     * @param {MouseEvent | TouchEvent} e 
     */
    endDrag (e) {
        if(this.origin && this.lastTranslate) {
            this.carousel.enableTransition()
            if (Math.abs(this.lastTranslate.x / this.carousel.carouselWidth) > 0.2) {
                if (this.lastTranslate.x < 0) {
                    this.carousel.next()
                } else {
                    this.carousel.prev()
                }
            } else {
                this.carousel.goToItem(this.carousel.currentItem)
            }
        }
        this.origin = null
    }
}


class Carousel {
    /**
     * This callback type is called 'requestCallback' and is a displayed as a global symbol.
     *
     * @callback moveCallback
     * @param {number} index
     */


    /**
     * @param {HTMLElement} element
     * @param {Object} options
     * @param {Object} [options.slidesToScroll=1] : Number of items to scroll
     * @param {Object} [options.slidesVisible=1] : Number of visible elements in a slide
     * @param {boolean} [options.loop=false] : To loop or not at the end of the carousel
     * @param {boolean} [options.infinite=false] : Ta make or not an infinite carousel scroll
     * @param {boolean} [options.pagination=false] : To activate the pagination
     * @param {boolean} [options.navigation=true] : To activate the navigation
     * 

    **/

    constructor(element, options = {}) {
        this.element = element,
            this.options = Object.assign({}, {
                slidesToScroll: 1,
                slidesVisible: 1,
                loop: false,
                pagination: false,
                navigation: true,
                infinite: false,
                autoScroll: false,
                autoScrollTime: 2000,
                breakTime: 1000 
            }, options)
        if (this.options.loop && this.options.infinite) {
            throw new Error("a carousel cannot be both looped and infinite")
        }
        let children = [].slice.call(element.children)
        this.isMobile = true
        this.currentItem = 0
        this.moveCallbacks = []
        this.offset = 0
        this.intervalId = null

        // Dom Modification
        this.root = this.createDivWithClass('carousel')
        this.container = this.createDivWithClass('carousel__container')
        this.container.setAttribute('aria-live', 'polite')
        this.root.setAttribute('tabindex', '0')
        this.root.appendChild(this.container)
        this.element.appendChild(this.root)
        this.items = children.map((child) => {
            let item = this.createDivWithClass('carousel__item')
            item.appendChild(child)
            return item
        })
        if (this.options.infinite) {
            this.offset = this.options.slidesVisible + this.options.slidesToScroll
            if (this.offset > children.length) {
                console.error("not enough elements in the carousel ", element)
            }
            this.items = [
                ...this.items.slice(this.items.length - this.offset).map(item => item.cloneNode(true)),
                ...this.items,
                ...this.items.slice(0, this.offset).map(item => item.cloneNode(true))
            ]
            this.goToItem(this.offset, false)
        }
        this.items.forEach(item => this.container.appendChild(item))
        this.setStyle()
        if (this.options.navigation) {
            this.createNavigation()
        }
        if (this.options.pagination) {
            this.createPagination()
        }
        if (this.options.autoScroll) {
            this.startAutoScroll()
        }


        //Event
        this.moveCallbacks.forEach(cb => cb(this.currentItem))
        this.onWindowsResize()
        window.addEventListener('resize', this.onWindowsResize.bind(this))
        this.root.addEventListener('keyup', e => {
            if (e.key === 'ArrowRight' || e.key === 'Right') {
                this.next()
            } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
                this.prev()
            }
        })
        if (this.options.infinite) {
            this.container.addEventListener('transitionend', this.resetInfinite.bind(this))
        }
        new CarouselTouchPlugin(this)
    }

    /** 
     * To apply the correct dimensions of the elements to the carousel
     
    **/
    setStyle() {
        let ratio = this.items.length / this.slidesVisible
        this.container.style.width = (ratio * 100) + "%"
        this.items.forEach(item => item.style.width = ((100 / this.slidesVisible) / ratio) + "%")
    }

    startAutoScroll() {
        this.intervalId = setInterval(() => {
            this.goToItem(this.currentItem + this.slidesToScroll)
        }, this.options.autoScrollTime + this.options.breakTime);
    }

    resetAutoScrollTimer() {
        clearInterval(this.intervalId); // Arrêter l'intervalle actuel
        this.startAutoScroll();
    }
    /**
         * 
         *To create the navigation buttons
         */
    createNavigation() {
        let nextButton = this.createButtonWithClassAndName('carousel__next', 'Suivant')
        let prevButton = this.createButtonWithClassAndName('carousel__prev', 'Précédent')
        this.root.appendChild(nextButton)
        this.root.appendChild(prevButton)
        nextButton.addEventListener('click', this.next.bind(this))
        prevButton.addEventListener('click', this.prev.bind(this))
        if (this.options.loop === true) {
            return
        }
        this.onMove(index => {
            if (index === 0) {
                prevButton.classList.add('carousel__prev--hidden')
            } else {
                prevButton.classList.remove('carousel__prev--hidden')
            }
            if (this.items[this.currentItem + this.slidesVisible] === undefined) {
                nextButton.classList.add('carousel__next--hidden')
            } else {
                nextButton.classList.remove('carousel__next--hidden')
            }
        })
    }
    /**
     * 
     *To create the pagination elements
     */
    createPagination() {
        let pagination = this.createDivWithClass('carousel__pagination')
        let buttons = []
        this.root.appendChild(pagination)
        for (let i = 0; i < (this.items.length - 2 * this.offset); i = i + this.options.slidesToScroll) {
            let button = this.createDivWithClass('carousel__pagination__button')
            button.addEventListener('click', () => this.goToItem(i + this.offset))
            pagination.appendChild(button)
            buttons.push(button)
        }
        this.onMove(index => {
            let count = this.items.length - 2 * this.offset
            let activeButton = buttons[Math.floor(((index - this.offset) % count) / this.options.slidesToScroll)]
            if (activeButton) {
                buttons.forEach(button => button.classList.remove('carousel__pagination__button--active'))
                activeButton.classList.add('carousel__pagination__button--active')
            }
        })
    }

    translate (percent) {
        this.container.style.transform = 'translate3d(' + percent + '%, 0, 0)'
    }

    next() {
        this.goToItem(this.currentItem + this.slidesToScroll)
        this.resetAutoScrollTimer();


    }

    prev() {
        this.resetAutoScrollTimer();
        this.goToItem(this.currentItem - this.slidesToScroll)
    }
    /** 
     * To move the carousel to the target element
     * @param {number} [index]
     * @param {boolean} [animation = true]
    **/
    goToItem(index, animation = true) {
        if (index < 0) {
            if (this.options.loop) {
                index = this.items.length - this.slidesVisible
            } else {
                return
            }

        } else if (index >= this.items.length || (this.items[this.currentItem + this.slidesVisible] === undefined && index > this.currentItem)) {
            if (this.options.loop) {
                index = 0
            } else {
                return
            }

        }
        let translateX = index * -100 / this.items.length
        if (animation === false) {
            this.disableTransition()
        }
        this.translate(translateX)
        this.container.style.transform = 'translate3d(' + translateX + '%, 0, 0)'
        this.container.offsetHeight // force repaint
        if (animation === false) {
            this.enableTransition()
        }

        this.currentItem = index
        this.moveCallbacks.forEach(cb => cb(index))
    }
    /**
     * To move the container to give the impression of an infinite slide
     */
    resetInfinite() {
        if (this.currentItem <= this.options.slidesToScroll) {
            this.goToItem(this.currentItem + (this.items.length - 2 * this.offset), false)
        } else if (this.currentItem >= this.items.length - this.offset) {
            this.goToItem(this.currentItem - (this.items.length - 2 * this.offset), false)
        }
    }

    /**
     * 
     * @param {moveCallback} cb
     * 
     */

    onMove(cb) {
        this.moveCallbacks.push(cb)
    }

    onWindowsResize() {
        let mobile = window.innerWidth < 800
        if (mobile !== this.isMobile) {
            this.isMobile = mobile
            this.setStyle()
            this.moveCallbacks.forEach(cb => cb(this.currentItem))
        }
    }



    /** 
     * @param {string} className
     * @returns {HTMLElement}
    **/
    createDivWithClass(className) {
        let div = document.createElement('div')
        div.setAttribute('class', className)
        return div
    }

    /** 
     * @param {string} className
     * @returns {HTMLElement}
    **/
    createButtonWithClassAndName(className, name) {
        let button = document.createElement('button')
        button.setAttribute('class', className)
        button.setAttribute('aria-label', name)
        button.textContent = name
        return button
    }

    disableTransition() {
        this.container.style.transition = 'none'
    }

    enableTransition() {
        this.container.style.transition = ''
    }
    /**
     * @returns {number}
     */
    get slidesToScroll() {
        return this.isMobile ? 1 : this.options.slidesToScroll
    }

    /**
    * @returns {number}
    */
    get slidesVisible() {
        return this.isMobile ? 1 : this.options.slidesVisible
    }
    /**
     * @returns {number}
     */
    get containerWitdth () {
       return this.container.offsetWidth
    }

    /**
     * @returns {number}
     */
    get carouselWidth () {
        return this.root.offsetWidth
    }
}

let onReady = function () {
  
}

new Carousel(document.querySelector('#carousel1'), {
    slidesToScroll: 1,
    slidesVisible: 1,
    loop: false,
    pagination: true,
    infinite: true,
    autoScroll: true,
    autoScrollTime: 3000,
    breakTime:2000
})

/* body-scroll-locks */

let hasPassiveEvents = false;
if (typeof window !== 'undefined') {
  const passiveTestOptions = {
    get passive() {
      hasPassiveEvents = true;
      return undefined;
    }
  };
  window.addEventListener('testPassive', null, passiveTestOptions);
  window.removeEventListener('testPassive', null, passiveTestOptions);
}

const isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


let locks = [];
let documentListenerAdded = false;
let initialClientY = -1;
let previousBodyOverflowSetting;
let previousBodyPosition;
let previousBodyPaddingRight;

// returns true if `el` should be allowed to receive touchmove events.
const allowTouchMove = el => locks.some(lock => {
  if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
    return true;
  }

  return false;
});

const preventDefault = rawEvent => {
  const e = rawEvent || window.event;

  // For the case whereby consumers adds a touchmove event listener to document.
  // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
  // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
  // the touchmove event on document will break.
  if (allowTouchMove(e.target)) {
    return true;
  }

  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1) return true;

  if (e.preventDefault) e.preventDefault();

  return false;
};

const setOverflowHidden = options => {
  // If previousBodyPaddingRight is already set, don't set it again.
  if (previousBodyPaddingRight === undefined) {
    const reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
    const scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

    if (reserveScrollBarGap && scrollBarGap > 0) {
      const computedBodyPaddingRight = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'), 10);
      previousBodyPaddingRight = document.body.style.paddingRight;
      document.body.style.paddingRight = `${computedBodyPaddingRight + scrollBarGap}px`;
    }
  }

  // If previousBodyOverflowSetting is already set, don't set it again.
  if (previousBodyOverflowSetting === undefined) {
    previousBodyOverflowSetting = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
};

const restoreOverflowSetting = () => {
  if (previousBodyPaddingRight !== undefined) {
    document.body.style.paddingRight = previousBodyPaddingRight;

    // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
    // can be set again.
    previousBodyPaddingRight = undefined;
  }

  if (previousBodyOverflowSetting !== undefined) {
    document.body.style.overflow = previousBodyOverflowSetting;

    // Restore previousBodyOverflowSetting to undefined
    // so setOverflowHidden knows it can be set again.
    previousBodyOverflowSetting = undefined;
  }
};

const setPositionFixed = () => window.requestAnimationFrame(() => {
  // If previousBodyPosition is already set, don't set it again.
  if (previousBodyPosition === undefined) {
    previousBodyPosition = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left
    };

    // Update the dom inside an animation frame
    const { scrollY, scrollX, innerHeight } = window;
    document.body.style.position = 'fixed';
    document.body.style.top = `${-scrollY}px`;
    document.body.style.left = `${-scrollX}px`;

    setTimeout(() => window.requestAnimationFrame(() => {
      // Attempt to check if the bottom bar appeared due to the position change
      const bottomBarHeight = innerHeight - window.innerHeight;
      if (bottomBarHeight && scrollY >= innerHeight) {
        // Move the content further up so that the bottom bar doesn't hide it
        document.body.style.top = -(scrollY + bottomBarHeight);
      }
    }), 300);
  }
});

const restorePositionSetting = () => {
  if (previousBodyPosition !== undefined) {
    // Convert the position from "px" to Int
    const y = -parseInt(document.body.style.top, 10);
    const x = -parseInt(document.body.style.left, 10);

    // Restore styles
    document.body.style.position = previousBodyPosition.position;
    document.body.style.top = previousBodyPosition.top;
    document.body.style.left = previousBodyPosition.left;

    // Restore scroll
    window.scrollTo(x, y);

    previousBodyPosition = undefined;
  }
};

// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
const isTargetElementTotallyScrolled = targetElement => targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;

const handleScroll = (event, targetElement) => {
  const clientY = event.targetTouches[0].clientY - initialClientY;

  if (allowTouchMove(event.target)) {
    return false;
  }

  if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
    // element is at the top of its scroll.
    return preventDefault(event);
  }

  if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
    // element is at the bottom of its scroll.
    return preventDefault(event);
  }

  event.stopPropagation();
  return true;
};

export const disableBodyScroll = (targetElement, options) => {
  // targetElement must be provided
  if (!targetElement) {
    // eslint-disable-next-line no-console
    console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
    return;
  }

  // disableBodyScroll must not have been called on this targetElement before
  if (locks.some(lock => lock.targetElement === targetElement)) {
    return;
  }

  const lock = {
    targetElement,
    options: options || {}
  };

  locks = [...locks, lock];

  if (isIosDevice) {
    setPositionFixed();
  } else {
    setOverflowHidden(options);
  }

  if (isIosDevice) {
    targetElement.ontouchstart = event => {
      if (event.targetTouches.length === 1) {
        // detect single touch.
        initialClientY = event.targetTouches[0].clientY;
      }
    };
    targetElement.ontouchmove = event => {
      if (event.targetTouches.length === 1) {
        // detect single touch.
        handleScroll(event, targetElement);
      }
    };

    if (!documentListenerAdded) {
      document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
      documentListenerAdded = true;
    }
  }
};

export const clearAllBodyScrollLocks = () => {
  if (isIosDevice) {
    // Clear all locks ontouchstart/ontouchmove handlers, and the references.
    locks.forEach(lock => {
      lock.targetElement.ontouchstart = null;
      lock.targetElement.ontouchmove = null;
    });

    if (documentListenerAdded) {
      document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
      documentListenerAdded = false;
    }

    // Reset initial clientY.
    initialClientY = -1;
  }

  if (isIosDevice) {
    restorePositionSetting();
  } else {
    restoreOverflowSetting();
  }

  locks = [];
};

export const enableBodyScroll = targetElement => {
  if (!targetElement) {
    // eslint-disable-next-line no-console
    console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
    return;
  }

  locks = locks.filter(lock => lock.targetElement !== targetElement);

  if (isIosDevice) {
    targetElement.ontouchstart = null;
    targetElement.ontouchmove = null;

    if (documentListenerAdded && locks.length === 0) {
      document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
      documentListenerAdded = false;
    }
  }

  if (isIosDevice) {
    restorePositionSetting();
  } else {
    restoreOverflowSetting();
  }
};

/* Lightbox */

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
        dom.setAttribute('arial-label', 'Lightbox')
        dom.innerHTML = `<button class="lightbox__close">Fermer</button>
		<button class="lightbox__next">Suivant</button>
		<button class="lightbox__prev">Précédent</button>
		<div class="lightbox__container"></div>
        <div class="lightbox__background"></div>`
        dom.querySelector('.lightbox__close').addEventListener('click', this.close.bind(this))
        dom.querySelector('.lightbox__next').addEventListener('click', this.next.bind(this))
        dom.querySelector('.lightbox__prev').addEventListener('click', this.prev.bind(this))
        dom.querySelector('.lightbox__background').addEventListener('click', this.close.bind(this))
        return dom
    }
}

Lightbox.init()

/* Filter */

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



