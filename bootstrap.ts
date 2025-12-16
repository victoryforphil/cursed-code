#!/usr/bin/env bun
// cursed-code bootstrap

import { existsSync } from "fs"
import { resolve, dirname } from "path"

const home = Bun.env.HOME!
const marker = "# cursed-code"

// Detect RC file: check $SHELL first, then fallback to existence
function getRcFile(): string {
  const bashrc = `${home}/.bashrc`
  const zshrc = `${home}/.zshrc`
  
  const shell = Bun.env.SHELL || ""
  
  if (shell.includes("zsh")) {
    return zshrc
  } else if (shell.includes("bash")) {
    return bashrc
  }
  
  // Fallback to existence check
  if (existsSync(zshrc)) return zshrc
  if (existsSync(bashrc)) return bashrc
  
  return bashrc
}

const rcFile = getRcFile()
const configDir = resolve(dirname(import.meta.path), ".opencode")
const exportLine = `export OPENCODE_CONFIG_DIR="${configDir}"`

// Read current RC content
let content = ""
if (existsSync(rcFile)) {
  content = await Bun.file(rcFile).text()
}

// Check if already configured
if (content.includes(marker)) {
  console.log(`✓ cursed-code already configured in ${rcFile}`)
} else {
  // Append configuration
  const addition = `\n${marker}\n${exportLine}\n`
  await Bun.write(rcFile, content + addition)
  console.log(`✓ Added OPENCODE_CONFIG_DIR to ${rcFile}`)
}

console.log(`  Config: ${configDir}`)
console.log(`\nRunning post-bootstrap setup...\n`)

// Run opencode with bootstrap command
const proc = Bun.spawn(["opencode", "run", "/bootstrap"], {
  stdio: ["inherit", "inherit", "inherit"],
})

await proc.exited