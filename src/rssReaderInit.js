import { watch } from 'melanke-watchjs';
import { handleInput, inputState } from './handleInput';

export default () => {
  const input = document.getElementById('inputFeed');
  const addFeedBtn = document.getElementById('btn-add-feed');
  const inputClasses = input.classList;
  watch(inputState, 'status', (prop, action, newvalue) => {
    switch (newvalue) {
      case 'empty':
        console.log('empty');
        break;
      case 'isNewURL':
        inputClasses.remove('border-danger');
        inputClasses.add('border', 'border-success');
        addFeedBtn.removeAttribute('disabled');
        break;
      case 'isDouble':
        inputClasses.add('border', 'border-warning');
        addFeedBtn.setAttribute('disabled', 'disabled');
        break;
      case 'notURL':
        inputClasses.add('border', 'border-danger');
        addFeedBtn.setAttribute('disabled', 'disabled');
        break;
      default:
        console.log('error');
    }
  });

  input.addEventListener('keyup', handleInput);
};
