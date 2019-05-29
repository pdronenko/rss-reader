export default class Example {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.innerHTML = `
      <main role="main" class="container">
        <div class="jumbotron">
          <h1>Navbar example</h1>
          <p class="lead">This example is a quick exercise to illustrate how the top-aligned navbar works. As you scroll, this navbar remains in its original position and moves with the rest of the page.</p>
          <a class="btn btn-lg btn-primary" href="../../components/navbar/" role="button">View navbar docs</a>
        </div>
      </main>
    `;
  }
}
