export default class Example {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.innerHTML = `
      <main role="main" class="container">
        <div class="jumbotron">
          <h1>RSS reader</h1>
          <p class="lead">Welcome to RSS reader</p>
            <form>
              <div class="form-group">
                <label for="inputFeed">Feed URL or website...</label>
                <input type="text" class="form-control" id="inputFeed" aria-describedby="feedHelp" placeholder="...">
                <small id="feedHelp" class="form-text text-muted">Enter a site or feed URL to add feed</small>
              </div>
              <button type="submit" class="btn btn-primary">Add feed</button>
            </form>
        </div>
      </main>
    `;
  }
}
