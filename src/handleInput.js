import { isURL } from 'validator';

export const inputState = {
  text: '',
  status: 'empty',
  actions: [
    {
      status: 'empty',
      check: str => str === '',
    },
    {
      status: 'notURL',
      check: str => !isURL(str),
    },
    {
      status: 'isDouble',
      check: str => str === 'google.com',
    },
    {
      status: 'isNewURL',
      check: isURL,
    },
  ],
};

export const handleInput = ({ target }) => {
  const inputText = target.value;
  inputState.text = inputText;
  const { status } = inputState.actions.find(({ check }) => check(inputText));
  inputState.status = status;
};
