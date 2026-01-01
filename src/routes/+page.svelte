<script lang="ts">
  /**
   * Main application page.
   *
   * This is the entry point for the Gibber AI application.
   * It will be replaced with the full application layout in Phase 8.
   */

  import { invoke } from "@tauri-apps/api/core";

  let name = $state("");
  let greetMsg = $state("");

  /**
   * Handles the greet form submission.
   * Calls the Rust backend to generate a greeting message.
   */
  async function handleGreet(event: Event): Promise<void> {
    event.preventDefault();
    greetMsg = await invoke<string>("greet", { name });
  }
</script>

<main class="container">
  <h1>Gibber AI</h1>
  <p>Audiovisual live coding with AI</p>

  <form class="greeting-form" onsubmit={handleGreet}>
    <input
      id="greet-input"
      placeholder="Enter a name..."
      bind:value={name}
      aria-label="Name input"
    />
    <button type="submit">Greet</button>
  </form>

  {#if greetMsg}
    <p class="greeting-message">{greetMsg}</p>
  {/if}
</main>

<style>
  :root {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: #0f0f0f;
    background-color: #f6f6f6;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .container {
    margin: 0;
    padding-top: 10vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }

  h1 {
    margin-bottom: 0.5rem;
  }

  .greeting-form {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }

  input,
  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    color: #0f0f0f;
    background-color: #ffffff;
    transition: border-color 0.25s;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
  }

  button {
    cursor: pointer;
  }

  button:hover {
    border-color: #396cd8;
  }

  .greeting-message {
    margin-top: 1rem;
    font-weight: 500;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      color: #f6f6f6;
      background-color: #2f2f2f;
    }

    input,
    button {
      color: #ffffff;
      background-color: #0f0f0f98;
    }
  }
</style>
