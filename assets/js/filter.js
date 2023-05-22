/* Filter */

export const filterInit  = function() {
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
}
