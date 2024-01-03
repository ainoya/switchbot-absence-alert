# Absence Alert System using SwitchBot Motion Sensor and Cloudflare Workers

## Overview

This repository contains a custom-built motion alert system utilizing the SwitchBot motion sensor and Cloudflare Workers. While SwitchBot's default functionality allows triggering actions upon motion detection, it lacks the capability to trigger actions when no motion is detected over extended periods, particularly beyond 30 minutes. This system bridges that gap by leveraging Cloudflare Workers and the SwitchBot API to detect absence of motion over intervals longer than 30 minutes.

## Features

- **Extended Absence Detection:** Unlike the default settings of SwitchBot, this system can detect the absence of motion over periods exceeding 30 minutes, making it ideal for monitoring unoccupied spaces for extended durations.
- **Cloudflare Workers Integration:** The system uses Cloudflare Workers to handle webhook requests from the SwitchBot API. When the motion sensor detects movement, the event's timestamp is recorded in Cloudflare KV (Key-Value) storage.
- **Scheduled Checks:** Cloudflare Workers perform scheduled executions to retrieve the last motion detection timestamp from Cloudflare KV. If no motion has been detected for over 6 hours, the system sends a notification.
- **Notification System:** Notifications are sent using Pushover, ensuring timely alerts for extended inactivity detected by the motion sensor.

## Application

This system is particularly useful in scenarios where monitoring the absence of movement is as critical as detecting motion. Examples include ensuring security in rarely accessed areas, monitoring the well-being of individuals living alone, or simply checking that a space remains undisturbed during specified periods.

## Getting Started

To implement this system, you will need a SwitchBot motion sensor and an active Cloudflare Workers account. Detailed setup instructions and code are provided in the repository, guiding you through configuring the SwitchBot API, Cloudflare Workers, and Pushover notifications.

---

**Note:** This system enhances the SwitchBot's capabilities and is not a substitute for its primary functions. It's recommended to have a basic understanding of Cloudflare Workers and API integrations for a smooth setup.
