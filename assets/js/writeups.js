"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("writeup-list");
  const filterBox = document.getElementById("writeup-filters");
  if (!list) return;

  const showMessage = (message) => {
    list.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "writeup-message";
    paragraph.textContent = message;
    list.appendChild(paragraph);
  };

  const levelClass = (level) => {
    const value = level.toLowerCase();
    if (value === "easy" || value === "beginner") return "lvl-easy";
    if (value === "hard") return "lvl-hard";
    return "lvl-medium";
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const renderPost = (post) => {
    const row = el("a", "writeup-row");
    row.href = post.url;

    const meta = el("div", "writeup-meta");
    meta.append(
      el("time", "writeup-date", post.date),
      el("span", "lvl " + levelClass(post.level), post.level),
      el("span", "writeup-category", post.category)
    );
    if (Number.isFinite(post.minutes)) {
      meta.append(el("span", "writeup-time", post.minutes + " min read"));
    }
    row.append(meta, el("span", "writeup-title", post.title));
    if (typeof post.description === "string" && post.description) {
      row.append(el("span", "writeup-description", post.description));
    }
    return row;
  };

  try {
    const response = await fetch("/writeups/writeups.json", {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error("Unable to load write-ups.");

    const posts = await response.json();
    if (!Array.isArray(posts)) throw new Error("Invalid write-up data.");

    const sortedPosts = posts
      .filter((post) => post &&
        typeof post.title === "string" &&
        typeof post.date === "string" &&
        typeof post.level === "string" &&
        typeof post.category === "string" &&
        typeof post.url === "string" &&
        /^\/writeups\/[a-z0-9-]+\.html$/.test(post.url))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sortedPosts.length === 0) {
      showMessage("No write-ups published yet.");
      return;
    }

    let activeCategory = "all";
    const limit = Number.parseInt(list.dataset.limit, 10);

    const render = () => {
      list.replaceChildren();
      const visible = sortedPosts
        .filter((post) => activeCategory === "all" || post.category === activeCategory);
      (Number.isFinite(limit) ? visible.slice(0, limit) : visible)
        .forEach((post) => list.appendChild(renderPost(post)));
    };

    if (filterBox) {
      const categories = [...new Set(sortedPosts.map((post) => post.category))];
      const buttons = [];

      const addButton = (value, label, count) => {
        const button = el("button", "filter");
        button.type = "button";
        button.dataset.value = value;
        button.append(label, el("span", "filter-count", String(count)));
        button.addEventListener("click", () => {
          activeCategory = value;
          buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === value)));
          render();
        });
        buttons.push(button);
        filterBox.appendChild(button);
      };

      addButton("all", "all", sortedPosts.length);
      categories.forEach((category) => {
        addButton(category, category, sortedPosts.filter((p) => p.category === category).length);
      });
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value === "all")));
    }

    render();
  } catch (error) {
    console.error("Write-up loading error:", error);
    showMessage("Unable to load write-ups. Please try again later.");
  }
});
