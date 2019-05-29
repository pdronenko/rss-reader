import { isURL } from 'validator';
import header from './header';

export default () => {
  document.body.innerHTML = header();
  const form = document.getElementById('inputFeed');
  const addFeedBtn = document.getElementById('btn-add-feed');

  const validateInput = ({ target }) => {
    const inputClasses = target.classList;
    if (isURL(target.value)) {
      inputClasses.remove('border-danger');
      inputClasses.add('border', 'border-success');
      addFeedBtn.removeAttribute('disabled');
      return;
    }
    inputClasses.add('border', 'border-danger');
    addFeedBtn.setAttribute('disabled', 'disabled');
  };

  form.addEventListener('keyup', validateInput);
};
