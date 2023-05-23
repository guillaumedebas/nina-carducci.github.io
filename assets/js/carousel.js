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
        carousel.container.addEventListener('mousedown', this.startDrag.bind(this), {passive: true})
        carousel.container.addEventListener('touchstart', this.startDrag.bind(this), {passive: true})
        window.addEventListener('mousemove', this.drag.bind(this), {passive: true})
        window.addEventListener('touchmove', this.drag.bind(this), {passive: true})
        window.addEventListener('touchend', this.endDrag.bind(this), {passive: true})
        window.addEventListener('mouseup', this.endDrag.bind(this), {passive: true})
        window.addEventListener('touchcancel', this.endDrag.bind(this), {passive: true})
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


export class Carousel {
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
            item.setAttribute('role', 'listitem')
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

