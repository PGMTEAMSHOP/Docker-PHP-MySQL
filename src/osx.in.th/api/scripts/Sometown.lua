local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local TweenService = game:GetService("TweenService")
local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Unknown Game"

local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    warn("OSX: Local file not found, loading from GitHub...")
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end

local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    -- FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

local Tabs = {
    Info = Window:AddTab({ Title = "Info", SubDescription = "Information", Icon = "info" }),
	Player = Window:AddTab({ Title = "Player", SubDescription = "ESP & MORE", Icon = "user" }),
	Aimbot = Window:AddTab({ Title = "Aimbot", SubDescription = "Aimbot & MORE", Icon = "lock" }),
    Car = Window:AddTab({ Title = "Car Modify", SubDescription = "Car Modify & MORE", Icon = "fire" }),
    Teleport = Window:AddTab({ Title = "Teleport", SubDescription = "Teleport & MORE", Icon = "map" }),
    Misc = Window:AddTab({ Title = "Misc", Icon = "component", SubDescription = "Optimization & AFK" })
}


local InfoPanel = Tabs.Info:AddPanel("Information")
InfoPanel:AddInfoLabel("Owner Product:", "Black Mage.")
InfoPanel:AddInfoLabel("Developer Main:", "0b1100001cat")
InfoPanel:AddInfoLabel("Developer Backup:", "LilYouDev1997x")
InfoPanel:AddInfoLabel("Discord:", "https://discord.gg/osxhub")

InfoPanel:AddWideButton({
    Title = "Discord Server",
    Callback = function() pcall(function() setclipboard("https://discord.gg/osxhub") end) end
})


local Teleportx1 = Tabs.Teleport:AddPanel("Teleport Zones")

local teleId = 0
local currentTween = nil
local originalTransparencies = nil

local function makeInvisible(char)
    local cache = {}
    for _, obj in pairs(char:GetDescendants()) do
        if obj:IsA("BasePart") or obj:IsA("Decal") then
            cache[obj] = obj.Transparency
            obj.Transparency = 1
        end
    end
    return cache
end

local function makeVisible(cache)
    if not cache then return end
    for obj, trans in pairs(cache) do
        pcall(function()
            if obj and obj.Parent then
                obj.Transparency = trans
            end
        end)
    end
end

local function teleportTo(vector)
    local char = LocalPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end

    teleId = teleId + 1
    local currentTeleId = teleId

    -- ยกเลิก Tween เดิมและทำให้ตัวละครกลับมามองเห็นได้หากกำลังวาร์ปอยู่
    if currentTween then
        pcall(function() currentTween:Cancel() end)
        currentTween = nil
    end
    if originalTransparencies then
        pcall(makeVisible, originalTransparencies)
        originalTransparencies = nil
    end

    -- ล่องหนตัวละคร
    originalTransparencies = makeInvisible(char)

    -- คำนวณระยะทางและเวลาในการเลื่อน (ความเร็ว 150 studs ต่อวินาที)
    local targetPos = vector + Vector3.new(0, 5, 0)
    local distance = (targetPos - hrp.Position).Magnitude
    local speed = 150
    local duration = math.clamp(distance / speed, 0.1, 15)

    hrp.Anchored = true
    
    local tweenInfo = TweenInfo.new(duration, Enum.EasingStyle.Linear)
    local tween = TweenService:Create(hrp, tweenInfo, { CFrame = CFrame.new(targetPos) })
    currentTween = tween
    tween:Play()

    task.spawn(function()
        tween.Completed:Wait()
        
        if teleId == currentTeleId then
            -- เลิกล่องหนทันทีเมื่อถึงจุดหมาย
            makeVisible(originalTransparencies)
            originalTransparencies = nil
            
            -- ล็อกลอยไว้ 5 วินาที
            task.wait(5)
            if teleId == currentTeleId then
                -- ปล่อยตัวลงพื้น
                if hrp and hrp.Parent then
                    hrp.Anchored = false
                end
            end
        end
    end)
end

Teleportx1:AddButton({
    Title = "Economy",
    Description = "วาร์ปไปตลาดโลก",
    Callback = function() teleportTo(Vector3.new(2849.16, 14.58, 2108.020)) end
})

Teleportx1:AddButton({
    Title = "Spawn New Player",
    Description = "วาร์ปไปจุดเกิดผู้เล่นใหม่",
    Callback = function() teleportTo(Vector3.new(3022.49, 15.19, 2148.26)) end
})

Teleportx1:AddButton({
    Title = "Market For Sell",
    Description = "วาร์ปไปตลาดฝากขาย",
    Callback = function() teleportTo(Vector3.new(3088.75, 19.88, 2614.69)) end
})

Teleportx1:AddButton({
    Title = "Machine",
    Description = "วาร์ปไปอู่ซ่อมรถ",
    Callback = function() teleportTo(Vector3.new(2784.89, 14.67, 2713.98)) end
})

Teleportx1:AddButton({
    Title = "Label Blue",
    Description = "วาร์ปไปเลเบลฟ้า",
    Callback = function() teleportTo(Vector3.new(1950.39, 14.36, 2295.86)) end
})

-- [[ PLAYER ESP LOGIC ]] --
local PlayerPanel = Tabs.Player:AddPanel("Player ESP")

local ActivePlayerESP = false
local ActivePlayerHP = false
local ActivePlayerHPBar = false
local espConnections = {}
local spawnedPlayerTags = {}
local espDrawings = {}
local successDrawing, DrawingLib = pcall(function() return Drawing end)

local function getCharacter(player)
    local charFolder = workspace:FindFirstChild("Character")
    if charFolder then
        local char = charFolder:FindFirstChild(player.Name)
        if char then return char end
    end
    return player.Character or workspace:FindFirstChild(player.Name)
end

local espMaxDistance = 1000

local function removeESP(player)
    if spawnedPlayerTags[player] then
        pcall(function() spawnedPlayerTags[player]:Destroy() end)
        spawnedPlayerTags[player] = nil
    end
    if espDrawings[player] then
        pcall(function() espDrawings[player].HealthBarOutline:Remove() end)
        pcall(function() espDrawings[player].HealthBar:Remove() end)
        espDrawings[player] = nil
    end
    
    -- Fallback: aggressively clean up any stuck billboards in the character
    local char = getCharacter(player)
    if char then
        for _, desc in pairs(char:GetDescendants()) do
            if desc:IsA("BillboardGui") and desc.Name == "OSX_Player_ESP" then
                pcall(function() desc:Destroy() end)
            end
        end
    end
end

local function applyESP(player)
    if player == LocalPlayer then return end
    
    local function setupChar(char)
        if not char then return end
        
        -- ถ้าปิดทั้งหมด ให้ลบป้ายชื่อและหลอดเลือด
        if not (ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar) then
            removeESP(player)
            return
        end
        
        local head = char:WaitForChild("Head", 5) or char:FindFirstChildWhichIsA("BasePart") or char.PrimaryPart
        if not head then return end
        
        local billboard = head:FindFirstChild("OSX_Player_ESP")
        local isNew = false
        if not billboard then
            billboard = Instance.new("BillboardGui")
            billboard.Name = "OSX_Player_ESP"
            billboard.Size = UDim2.new(0, 150, 0, 40)
            billboard.AlwaysOnTop = true
            billboard.StudsOffset = Vector3.new(0, 2.5, 0)
            billboard.ResetOnSpawn = false
            isNew = true
        end
        
        billboard.MaxDistance = espMaxDistance
        billboard.Adornee = head
        
        local label = billboard:FindFirstChildOfClass("TextLabel")
        if not label then
            label = Instance.new("TextLabel")
            label.Size = UDim2.new(1, 0, 1, 0)
            label.BackgroundTransparency = 1
            label.TextColor3 = Color3.fromRGB(0, 255, 120)
            label.TextSize = 12
            label.Font = Enum.Font.SourceSansBold
            label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
            label.TextStrokeTransparency = 0.2
            label.Parent = billboard
        end
        
        if successDrawing and DrawingLib then
            if not espDrawings[player] then
                local HealthBarOutline = Drawing.new("Square")
                HealthBarOutline.Thickness = 3
                HealthBarOutline.Filled = false
                HealthBarOutline.Color = Color3.new(0, 0, 0)
                HealthBarOutline.Transparency = 1
                HealthBarOutline.Visible = false

                local HealthBar = Drawing.new("Square")
                HealthBar.Thickness = 1
                HealthBar.Filled = true
                HealthBar.Color = Color3.new(0, 1, 0)
                HealthBar.Transparency = 1
                HealthBar.Visible = false

                espDrawings[player] = {
                    HealthBarOutline = HealthBarOutline,
                    HealthBar = HealthBar
                }
            end
        end

        local function updateText()
            local hum = char:FindFirstChildOfClass("Humanoid")
            local nameText = ActivePlayerESP and player.Name or ""
            local hpText = ""
            if hum then
                if ActivePlayerHP then
                    hpText = string.format(" [%d/%d]", math.floor(hum.Health), math.floor(hum.MaxHealth))
                end
            end
            label.Text = nameText .. hpText
        end
        
        updateText()
        
        local hum = char:FindFirstChildOfClass("Humanoid")
        local hpConnection
        if hum then
            hpConnection = hum.HealthChanged:Connect(updateText)
        end
        
        if isNew then
            billboard.Parent = head
            spawnedPlayerTags[player] = billboard
            billboard.Destroying:Connect(function()
                if hpConnection then
                    hpConnection:Disconnect()
                end
            end)
        end
    end
    
    local char = getCharacter(player)
    if char then
        setupChar(char)
    end
    
    if not espConnections[player.UserId .. "_added"] then
        espConnections[player.UserId .. "_added"] = player.CharacterAdded:Connect(function(char)
            task.wait(0.2)
            if ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar then
                setupChar(char)
            end
        end)
    end
    
    if not espConnections[player.UserId .. "_removing"] then
        espConnections[player.UserId .. "_removing"] = player.CharacterRemoving:Connect(function(char)
            removeESP(player)
        end)
    end
end

local function cleanPlayerESP(player)
    removeESP(player)
    if espConnections[player.UserId .. "_added"] then
        espConnections[player.UserId .. "_added"]:Disconnect()
        espConnections[player.UserId .. "_added"] = nil
    end
    if espConnections[player.UserId .. "_removing"] then
        espConnections[player.UserId .. "_removing"]:Disconnect()
        espConnections[player.UserId .. "_removing"] = nil
    end
end

PlayerPanel:AddToggle({
    Title = "Player Name ESP",
    Description = "แสดงชื่อผู้เล่นคนอื่นทะลุกำแพง",
    Default = false,
    Callback = function(Value)
        ActivePlayerESP = Value
        for _, plr in pairs(Players:GetPlayers()) do
            if ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar then
                applyESP(plr)
            else
                cleanPlayerESP(plr)
            end
        end
    end
})

PlayerPanel:AddToggle({
    Title = "Player HP ESP",
    Description = "แสดงระดับพลังชีวิต (HP) ของผู้เล่น",
    Default = false,
    Callback = function(Value)
        ActivePlayerHP = Value
        for _, plr in pairs(Players:GetPlayers()) do
            if ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar then
                applyESP(plr)
            else
                cleanPlayerESP(plr)
            end
        end
    end
})

PlayerPanel:AddToggle({
    Title = "Player HP Bar ESP",
    Description = "แสดงหลอดเลือดแบบแท่งตั้งข้างตัว",
    Default = false,
    Callback = function(Value)
        ActivePlayerHPBar = Value
        for _, plr in pairs(Players:GetPlayers()) do
            if ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar then
                applyESP(plr)
            else
                cleanPlayerESP(plr)
            end
        end
    end
})

PlayerPanel:AddSlider({
    Title = "ESP Max Distance",
    Description = "ระยะการมองเห็นของ ESP (100 - 5000)",
    Min = 100,
    Max = 2000,
    Default = 100,
    Rounding = 0,
    Callback = function(Value)
        espMaxDistance = tonumber(Value) or 1000
        for _, billboard in pairs(spawnedPlayerTags) do
            if billboard and billboard.Parent then
                billboard.MaxDistance = espMaxDistance
            end
        end
    end
})

local InfStaminaEnabled = false
PlayerPanel:AddToggle({
    Title = "Infinite Stamina",
    Description = "วิ่งได้ไม่จำกัด สตามิน่าไม่ลด",
    Default = false,
    Callback = function(Value)
        InfStaminaEnabled = Value
    end
})

game:GetService("RunService").Heartbeat:Connect(function()
    if InfStaminaEnabled then
        local status = LocalPlayer:FindFirstChild("Status")
        if status then
            status:SetAttribute("Stamina", 100)
        end
    end
end)

game:GetService("RunService").RenderStepped:Connect(function()
    for player, drawings in pairs(espDrawings) do
        local isVisible = false
        local char = getCharacter(player)
        if ActivePlayerHPBar and char and char:FindFirstChild("HumanoidRootPart") and char:FindFirstChild("Humanoid") then
            local hrp = char.HumanoidRootPart
            local hum = char.Humanoid
            
            if hum.Health > 0 then
                local screenPos, onScreen = workspace.CurrentCamera:WorldToViewportPoint(hrp.Position)
                local distance = (workspace.CurrentCamera.CFrame.Position - hrp.Position).Magnitude
                
                if onScreen and distance <= espMaxDistance then
                    local head = char:FindFirstChild("Head") or char:FindFirstChildWhichIsA("BasePart") or char.PrimaryPart
                    if head then
                        local headPos, _ = workspace.CurrentCamera:WorldToViewportPoint(head.Position + Vector3.new(0, 0.5, 0))
                        local legPos, _ = workspace.CurrentCamera:WorldToViewportPoint(hrp.Position - Vector3.new(0, 3, 0))
                        
                        local height = math.abs(headPos.Y - legPos.Y)
                        local width = height / 2
                        
                        local maxH = hum.MaxHealth > 0 and hum.MaxHealth or 100
                        local healthPct = math.clamp(hum.Health / maxH, 0, 1)
                        
                        local outline = drawings.HealthBarOutline
                        outline.Size = Vector2.new(4, height)
                        outline.Position = Vector2.new(screenPos.X - width/2 - 6, headPos.Y)
                        outline.Visible = true
                        
                        local bar = drawings.HealthBar
                        bar.Size = Vector2.new(2, height * healthPct)
                        bar.Position = Vector2.new(screenPos.X - width/2 - 5, headPos.Y + height * (1 - healthPct))
                        bar.Color = Color3.fromRGB(255 - (healthPct * 255), healthPct * 255, 0)
                        bar.Visible = true
                        
                        isVisible = true
                    end
                end
            end
        end
        
        if not isVisible then
            pcall(function()
                drawings.HealthBarOutline.Visible = false
                drawings.HealthBar.Visible = false
            end)
        end
    end
end)

Players.PlayerAdded:Connect(function(plr)
    if ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar then
        applyESP(plr)
    end
end)

Players.PlayerRemoving:Connect(function(plr)
    cleanPlayerESP(plr)
end)

local charFolder = workspace:FindFirstChild("Character")
if charFolder then
    charFolder.ChildAdded:Connect(function(char)
        task.wait(0.5)
        if ActivePlayerESP or ActivePlayerHP or ActivePlayerHPBar then
            local player = Players:FindFirstChild(char.Name)
            if player then
                applyESP(player)
            end
        end
    end)
    charFolder.ChildRemoved:Connect(function(char)
        local player = Players:FindFirstChild(char.Name)
        if player then
            removeESP(player)
        end
    end)
end

-- [[ AIMBOT LOGIC ]] --
local AimbotPanel = Tabs.Aimbot:AddPanel("Aimbot Settings")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Camera = workspace.CurrentCamera

local AimbotSettings = {
    Enabled = false,
    UseFOV = false,
    VisibleFOV = false,
    FOVRadius = 100,
    AimPart = "Head",
    Smoothness = 1,
    LockCrosshair = false,
    AimKey = Enum.UserInputType.MouseButton2,
    ToggleMode = false, -- false = Hold, true = Toggle
    Blacklist = {},
    UseWallCheck = false,
    MaxDistance = 1000
}

local successDrawing, DrawingLib = pcall(function() return Drawing end)
local FOVCircle = nil
if successDrawing and DrawingLib then
    FOVCircle = Drawing.new("Circle")
    FOVCircle.Position = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
    FOVCircle.Radius = AimbotSettings.FOVRadius
    FOVCircle.Filled = false
    FOVCircle.Color = Color3.fromRGB(255, 255, 255)
    FOVCircle.Visible = false
    FOVCircle.Thickness = 1
end

local aimPartMapping = {
    ["Head"] = {"Head"},
    ["Body"] = {"HumanoidRootPart", "Torso", "UpperTorso", "LowerTorso"},
    ["Arms"] = {"Right Arm", "Left Arm", "RightUpperArm", "LeftUpperArm", "RightLowerArm", "LeftLowerArm"},
    ["Legs"] = {"Right Leg", "Left Leg", "RightUpperLeg", "LeftUpperLeg", "RightLowerLeg", "LeftLowerLeg"},
    ["Foot"] = {"Right Foot", "Right Foot", "RightFoot", "RightFoot", "RightFoot", "RightFoot"}
    
    
}

local function getTargetPart(char)
    local partsToCheck = aimPartMapping[AimbotSettings.AimPart] or {"Head"}
    for _, partName in ipairs(partsToCheck) do
        local part = char:FindFirstChild(partName)
        if part then return part end
    end
    return nil
end

local function getClosestPlayer()
    local closestPlayer = nil
    local shortestDistance = AimbotSettings.UseFOV and AimbotSettings.FOVRadius or math.huge

    local centerPos = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)

    for _, player in pairs(Players:GetPlayers()) do
        if player ~= LocalPlayer and not AimbotSettings.Blacklist[player.Name] then
            local char = getCharacter(player)
            if char then
                local aimPart = getTargetPart(char)
                local humanoid = char:FindFirstChildOfClass("Humanoid")
                -- เช็คให้เลือดมากกว่า 1 (ถ้าเลือด 1 แปลว่าเป็นศพตามที่เกมตั้งไว้)
                if aimPart and humanoid and humanoid.Health > 1 then
                    local distToTarget = (Camera.CFrame.Position - aimPart.Position).Magnitude
                    if distToTarget <= AimbotSettings.MaxDistance then
                        local screenPos, onScreen = Camera:WorldToViewportPoint(aimPart.Position)
                        if onScreen then
                            local dist = (Vector2.new(screenPos.X, screenPos.Y) - centerPos).Magnitude
                            if dist < shortestDistance then
                                local canSee = true
                                if AimbotSettings.UseWallCheck then
                                    local rayParams = RaycastParams.new()
                                    rayParams.FilterType = Enum.RaycastFilterType.Exclude
                                    local ignoreList = {getCharacter(LocalPlayer), char}
                                    rayParams.FilterDescendantsInstances = ignoreList
                                    
                                    local rayDirection = aimPart.Position - Camera.CFrame.Position
                                    local rayResult = workspace:Raycast(Camera.CFrame.Position, rayDirection, rayParams)
                                    if rayResult then
                                        canSee = false -- โดนกำแพงบัง
                                    end
                                end
                                
                                if canSee then
                                    closestPlayer = player
                                    shortestDistance = dist
                                end
                            end
                        end
                    end
                end
            end
        end
    end
    return closestPlayer
end

AimbotPanel:AddToggle({
    Title = "Enable Aimbot",
    Description = "เปิด/ปิด Aimbot",
    Default = false,
    Callback = function(Value)
        AimbotSettings.Enabled = Value
    end
})

AimbotPanel:AddKeybind({
    Title = "Aimbot Key",
    Description = "กดเพื่อตั้งค่าปุ่มล็อกเป้า",
    Default = Enum.UserInputType.MouseButton2,
    Callback = function(Value)
        if typeof(Value) == "EnumItem" or type(Value) == "string" then
            AimbotSettings.AimKey = Value
        end
    end,
    ChangedCallback = function(NewKey)
        if typeof(NewKey) == "EnumItem" or type(NewKey) == "string" then
            AimbotSettings.AimKey = NewKey
        end
    end
})

AimbotPanel:AddDropdown({
    Title = "Aim Part",
    Description = "เลือกส่วนของร่างกายที่จะล็อกเป้า",
    Values = {"Head", "Body", "Arms", "Legs", "Foot"},
    Default = 1,
    Callback = function(Value)
        AimbotSettings.AimPart = Value
    end
})

AimbotPanel:AddDropdown({
    Title = "Aim Mode",
    Description = "Hold = กดค้างเพื่อล็อก, Toggle = กด 1 ครั้งเพื่อล็อก/เลิกล็อก",
    Values = {"Hold", "Toggle"},
    Default = 1,
    Callback = function(Value)
        if Value == "Toggle" then
            AimbotSettings.ToggleMode = true
        else
            AimbotSettings.ToggleMode = false
        end
        isAiming = false -- Reset aim state when switching modes
    end
})

local function GetPlayerNames()
    local names = {}
    for _, p in pairs(Players:GetPlayers()) do
        if p ~= LocalPlayer then
            table.insert(names, p.Name)
        end
    end
    return names
end

local BlacklistDropdown = AimbotPanel:AddMultiDropdown({
    Title = "Aimbot Blacklist",
    Description = "เลือกผู้เล่นที่จะไม่ล็อกเป้า (สามารถเลือกได้หลายคน)",
    Values = GetPlayerNames(),
    Default = {},
    Callback = function(Selected)
        AimbotSettings.Blacklist = {}
        if type(Selected) == "table" then
            -- For Multi-Dropdowns, usually a table or dictionary is returned
            for key, val in pairs(Selected) do
                -- Some UIs return [1] = "Name", others return ["Name"] = true
                if type(key) == "number" then
                    AimbotSettings.Blacklist[val] = true
                elseif type(val) == "boolean" and val then
                    AimbotSettings.Blacklist[key] = true
                elseif type(val) == "string" then
                    AimbotSettings.Blacklist[val] = true
                end
            end
        elseif type(Selected) == "string" then
            AimbotSettings.Blacklist[Selected] = true
        end
    end
})

AimbotPanel:AddButton({
    Title = "Refresh Blacklist Players",
    Description = "อัปเดตรายชื่อผู้เล่นในเซิร์ฟเวอร์",
    Callback = function()
        if BlacklistDropdown and BlacklistDropdown.Refresh then
            BlacklistDropdown:Refresh(GetPlayerNames())
        end
    end
})

AimbotPanel:AddToggle({
    Title = "Use FOV Limit",
    Description = "จำกัดระยะล็อกเป้าให้อยู่ใน FOV",
    Default = true,
    Callback = function(Value)
        AimbotSettings.UseFOV = Value
    end
})

AimbotPanel:AddToggle({
    Title = "Visible FOV Circle",
    Description = "แสดงเส้นวงกลม FOV บนหน้าจอ",
    Default = false,
    Callback = function(Value)
        AimbotSettings.VisibleFOV = Value
        if FOVCircle then
            FOVCircle.Visible = Value
        end
    end
})

AimbotPanel:AddSlider({
    Title = "FOV Radius",
    Description = "ขนาดของ FOV",
    Min = 10,
    Max = 1000,
    Default = 100,
    Rounding = 0,
    Callback = function(Value)
        AimbotSettings.FOVRadius = Value
        if FOVCircle then
            FOVCircle.Radius = Value
        end
    end
})

AimbotPanel:AddToggle({
    Title = "Lock Crosshair",
    Description = "ล็อกเป้า (Crosshair) ให้อยู่ตายตัวที่หน้าจอ",
    Default = false,
    Callback = function(Value)
        AimbotSettings.LockCrosshair = Value
    end
})

AimbotPanel:AddToggle({
    Title = "Wall Check",
    Description = "ตรวจสอบกำแพง (ไม่ล็อกเป้าคนที่หลบหลังกำแพง)",
    Default = false,
    Callback = function(Value)
        AimbotSettings.UseWallCheck = Value
    end
})

AimbotPanel:AddSlider({
    Title = "Aimbot Max Distance",
    Description = "ระยะล็อกเป้าไกลสุด",
    Min = 10,
    Max = 5000,
    Default = 1000,
    Rounding = 0,
    Callback = function(Value)
        AimbotSettings.MaxDistance = Value
    end
})

local isAiming = false

local function checkKeyMatch(input)
    local targetKey = AimbotSettings.AimKey
    
    if type(targetKey) == "string" then
        local keyName = targetKey
        local split = string.split(targetKey, ".")
        if #split >= 3 then
            keyName = split[3]
        end
        
        local success, enumObj = pcall(function() return Enum.UserInputType[keyName] end)
        if success and enumObj then
            return input.UserInputType == enumObj
        end
        
        success, enumObj = pcall(function() return Enum.KeyCode[keyName] end)
        if success and enumObj then
            return input.KeyCode == enumObj
        end
    elseif typeof(targetKey) == "EnumItem" then
        return input.UserInputType == targetKey or input.KeyCode == targetKey
    end
    
    return false
end

UserInputService.InputBegan:Connect(function(input, gpe)
    if checkKeyMatch(input) then
        if AimbotSettings.ToggleMode then
            isAiming = not isAiming -- สลับสถานะเปิด/ปิด
        else
            isAiming = true -- โหมดกดค้าง
        end
    end
end)
UserInputService.InputEnded:Connect(function(input, gpe)
    if checkKeyMatch(input) then
        if not AimbotSettings.ToggleMode then
            isAiming = false -- เลิกล็อกเป้าเฉพาะในโหมดกดค้าง
        end
    end
end)

RunService.RenderStepped:Connect(function()
    if FOVCircle then
        FOVCircle.Position = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y / 2)
    end

    if AimbotSettings.LockCrosshair then
        pcall(function()
            local crosshair = LocalPlayer.PlayerGui.UIList.Crossshair
            if crosshair then
                crosshair.Position = UDim2.new(0.5, 0, 0.5, 0)
            end
        end)
    end

    if AimbotSettings.Enabled then
        if isAiming then
            local target = getClosestPlayer()
            if target then
                local char = getCharacter(target)
                if char then
                    local aimPart = getTargetPart(char)
                    if aimPart then
                        Camera.CFrame = CFrame.new(Camera.CFrame.Position, aimPart.Position)
                    end
                end
            end
        end
    end
end)


local CarPanel = Tabs.Car:AddPanel("Vehicle Acceleration")

local velocityEnabled = false
local velocityMult = 0.025
local velocityEnabledKeyCode = Enum.KeyCode.W

CarPanel:AddToggle({
    Title = "Velocity Enabled",
    Description = "เปิดระบบเร่งความเร็ว (กดค้างเพื่อเร่งแบบทวีคูณ)",
    Default = false,
    Callback = function(Value)
        velocityEnabled = Value
    end
})

CarPanel:AddSlider({
    Title = "Multiplier (Thousandths)",
    Description = "ตัวคูณความเร็ว (จะถูกหารด้วย 1000 ให้เอง)",
    Min = 0,
    Max = 50,
    Default = 25,
    Rounding = 0,
    Callback = function(Value)
        velocityMult = Value / 1000
    end
})

CarPanel:AddKeybind({
    Title = "Velocity Keybind",
    Description = "ปุ่มสำหรับเร่งความเร็ว (ค่าเริ่มต้น W)",
    Default = "W",
    Callback = function(KeyString)
        local keyName = type(KeyString) == "string" and KeyString or "W"
        local split = string.split(keyName, ".")
        if #split >= 3 then
            keyName = split[3]
        end
        local success, keyObj = pcall(function() return Enum.KeyCode[keyName] end)
        if success and keyObj then
            velocityEnabledKeyCode = keyObj
        end
    end
})

UserInputService.InputBegan:Connect(function(input, gpe)
    if not gpe and input.KeyCode == velocityEnabledKeyCode then
        if not velocityEnabled then return end
        
        task.spawn(function()
            while UserInputService:IsKeyDown(velocityEnabledKeyCode) do
                task.wait(0)
                local Character = LocalPlayer.Character
                if Character and typeof(Character) == "Instance" then
                    local Humanoid = Character:FindFirstChildWhichIsA("Humanoid")
                    if Humanoid and typeof(Humanoid) == "Instance" then
                        local SeatPart = Humanoid.SeatPart
                        if SeatPart and typeof(SeatPart) == "Instance" and SeatPart:IsA("VehicleSeat") then
                            SeatPart.AssemblyLinearVelocity *= Vector3.new(1 + velocityMult, 1, 1 + velocityMult)
                        end
                    end
                end
                if not velocityEnabled then
                    break
                end
            end
        end)
    end
end)

OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})
