<script>
  import { reddit } from "./stores";

  let posts = [];
  let post_ids = new Set();

  let after = null;

  let render_busy = false;
</script>

<ul>
  {#each posts as { title, id } (id)}
    <li>{title}</li>
  {/each}
</ul>
<button
  disabled={render_busy}
  on:click={async function () {
    render_busy = true;
    const { data } = await $reddit.getPosts({ after, count: 9999, limit: 5 });
    after = data.after;
    data.children.forEach(({ data }) => {
      if (post_ids.has(data.id)) return;
      post_ids.add(data.id);
      posts = [...posts, data];
    });
    render_busy = false;
  }}
>
  {render_busy ? "Loading..." : "Render 5 posts"}
</button>
