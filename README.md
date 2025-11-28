# 6ixAssist 🍁

1st place @ Vibe the Code ElleHacks 2025!

A comprehensive resource finder designed to help Toronto residents locate essential services quickly and reliably. Whether you need food, shelter, health services, or legal aid, 6ixAssist connects you with verified local resources through an intuitive map-based interface.
- __[Devpost](https://devpost.com/software/6ixassist?ref_content=my-projects-tab&ref_feature=my_projects)__
- __[Vercel](6ixassist.vercel.app)__

## 🌟 Overview

Built at ElleHacks Vibe the Code 2025, 6ixAssist is a full-stack web application that bridges the gap between Toronto residents and critical community resources. Our platform combines real-time mapping, AI-powered assistance, and verified directory data to ensure that help is always just a click away.

## ✨ Key Features

* **📍 Interactive Resource Map**: Browse verified locations on an interactive map powered by Leaflet
* **🏢 Verified Directory**: Access a curated list of trusted Toronto organizations including CAMH, Daily Bread Food Bank, The 519, and more
* **🤖 6ixAssist AI**: Smart keyword detection provides instant, helpful answers and suggested searches for queries like "I need a place to sleep" or "food bank"
* **🔦 Smart Search**: Filter resources by category (Food, Shelter, Health, Legal, Crisis, Community) or search by name/address
* **🌗 Dark Mode**: Fully supported dark and light themes for comfortable viewing in any environment
* **📱 Mobile First**: Responsive design that works seamlessly on desktop and mobile devices
* **📢 Live Announcements**: Integration with Toronto Open Data to display relevant news and alerts
* 
## 📸 Screenshots
<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/64560f97-316b-4d73-a320-386a09c47c16" />
<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/4c7be337-015c-45f6-9eeb-38fb8fbee881" />
<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/927e3eba-5fe2-4462-8274-8da7b611c67d" />
<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/c4809403-ba92-4620-91f0-b60f4e97409d" />





## 🎯 The Problem We Solved

Many Toronto residents face challenges accessing critical services due to:
* Difficulty finding verified, trustworthy resources
* Lack of centralized information about available support
* Language barriers and complex navigation systems
* Limited awareness of nearby community services
* Time-sensitive needs requiring immediate assistance

## 🛠️ Tech Stack

**Frontend:**
* React 19
* Vite
* TypeScript
* Tailwind CSS

**Mapping & Location:**
* Leaflet
* React-Leaflet

**AI Integration:**
* Google Gemini API (Advanced query processing)

**Data Sources:**
* Toronto Open Data
* Curated Static Resources


## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* Google Maps API key
* Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/LoriB14/6ixassist.git
cd cityassist

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the root directory
```

Add the following to your `.env` file:
```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

```bash
# Run the development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

```bash
# Build for production
npm run build
```

## 💡 How It Works

1. **Allow Location Access**: The app works best when it knows your location to show nearby resources
2. **Search or Filter**: Type a query like "food" or click one of the quick category chips
3. **View Results**: See resources listed on the sidebar and pinned on the map
4. **Get Details**: Click a card or pin to see address, hours, phone number, and directions
5. **Use AI Assistant**: Ask natural language questions to get personalized recommendations

## 🏆 Achievements

* Built a complete full-stack application in under 24 hours
* Integrated AI-powered natural language processing for accessibility
* Created a verified directory of 50+ Toronto community resources
* Deployed production-ready application with responsive design
* Implemented real-time data integration with Toronto Open Data

## 🎓 What We Learned

* Integrating AI APIs to enhance user experience and accessibility
* Working with geolocation services and mapping libraries
* Managing and curating real-world community data
* Building responsive, accessible interfaces for diverse users
* Rapid full-stack development and deployment workflows
* Importance of user-centered design for vulnerable populations

## 🔮 Future Improvements

- [ ] Multi-language support (French, Mandarin, Spanish, etc.)
- [ ] User accounts to save favorite resources
- [ ] Community ratings and reviews
- [ ] Real-time availability updates from organizations
- [ ] SMS/text-based interface for users without smartphones
- [ ] Offline mode with cached resource data
- [ ] Integration with 211 Ontario database

## 👥 Team

* **[Lori Battouk]** - [GitHub](https://github.com/LoriB14) | [LinkedIn](https://www.linkedin.com/in/loribattouk/)
* **[Bianca Javier]** - [GitHub](https://github.com/biancacchino) | [LinkedIn](https://www.linkedin.com/in/biancajavier2006/)
* **[Aizah Sadiq]**  - [GitHub](https://github.com/aizahs) | [LinkedIn](https://www.linkedin.com/in/aizah-sadiq-431276278/)

## 🙏 Acknowledgments

* Thanks to [ElleHacks](https://ellehacks.com/) for organizing this incredible hackathon
* Toronto Open Data for providing accessible community resources data
* All the community organizations working tirelessly to support Toronto residents
* Our mentors who provided guidance throughout development

---

Made with ❤️ at ElleHacks 2025
